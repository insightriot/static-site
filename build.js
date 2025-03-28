const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');
const frontMatter = require('front-matter');
const hljs = require('highlight.js');

// Configure marked with syntax highlighting
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  gfm: true,
  breaks: true
});

// Ensure the docs directory exists
fs.ensureDirSync(path.join(__dirname, 'docs'));

// Copy assets to docs folder
fs.copySync(
  path.join(__dirname, 'src', 'assets'),
  path.join(__dirname, 'docs', 'assets')
);

// Process layouts
const layoutsDir = path.join(__dirname, 'src', 'layouts');
const layouts = {};

fs.readdirSync(layoutsDir).forEach(file => {
  if (file.endsWith('.html')) {
    const layoutName = path.basename(file, '.html');
    layouts[layoutName] = fs.readFileSync(path.join(layoutsDir, file), 'utf8');
  }
});

// Process pages
const pagesDir = path.join(__dirname, 'src', 'pages');
processDirectory(pagesDir, 'docs');

// Process blog posts
const postsDir = path.join(__dirname, 'src', 'posts');
const posts = [];

if (fs.existsSync(postsDir)) {
  fs.readdirSync(postsDir).forEach(file => {
    if (file.endsWith('.md')) {
      const content = fs.readFileSync(path.join(postsDir, file), 'utf8');
      const parsed = frontMatter(content);
      const html = marked.parse(parsed.body);
      
      // Format the date if it exists
      let formattedDate = '';
      if (parsed.attributes.date) {
        try {
          const dateObj = new Date(parsed.attributes.date);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
          } else {
            formattedDate = parsed.attributes.date;
          }
        } catch (e) {
          formattedDate = parsed.attributes.date;
          console.warn(`Could not format date for post: ${parsed.attributes.title}`);
        }
      }
      
      const postData = {
        ...parsed.attributes,
        content: html,
        slug: path.basename(file, '.md'),
        url: `./${path.basename(file, '.md')}.html`,
        formattedDate: formattedDate
      };
      
      posts.push(postData);
      
      // Create individual blog post page
      const postHtml = applyLayout('post', {
        ...postData,
        title: postData.title || 'Blog Post',
        content: html
      });
      
      fs.ensureDirSync(path.join(__dirname, 'docs', 'blog'));
      fs.writeFileSync(
        path.join(__dirname, 'docs', 'blog', `${postData.slug}.html`),
        postHtml
      );
    }
  });
  
  // Sort posts by date (newest first)
  posts.sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return dateB - dateA;
  });
  
  // Create blog index page
  const blogIndexHtml = applyLayout('blog', {
    title: 'Blog',
    posts: posts
  });
  
  fs.ensureDirSync(path.join(__dirname, 'docs', 'blog'));
  fs.writeFileSync(
    path.join(__dirname, 'docs', 'blog', 'index.html'),
    blogIndexHtml
  );
}

console.log('Build completed successfully!');

// Helper functions
function processDirectory(sourceDir, targetDir, basePath = '') {
  if (!fs.existsSync(sourceDir)) return;
  
  fs.readdirSync(sourceDir).forEach(item => {
    const sourcePath = path.join(sourceDir, item);
    const targetPath = path.join(__dirname, targetDir);
    const stat = fs.statSync(sourcePath);
    
    if (stat.isDirectory()) {
      const newBasePath = path.join(basePath, item);
      const newTargetDir = path.join(targetDir, item);
      fs.ensureDirSync(path.join(__dirname, newTargetDir));
      processDirectory(sourcePath, newTargetDir, newBasePath);
    } else if (item.endsWith('.md')) {
      const content = fs.readFileSync(sourcePath, 'utf8');
      const parsed = frontMatter(content);
      const html = marked.parse(parsed.body);
      
      const layoutName = parsed.attributes.layout || 'default';
      const pageData = {
        ...parsed.attributes,
        content: html,
        title: parsed.attributes.title || path.basename(item, '.md')
      };
      
      const pageHtml = applyLayout(layoutName, pageData);
      const outputPath = path.join(
        __dirname,
        targetDir,
        `${path.basename(item, '.md')}.html`
      );
      
      fs.writeFileSync(outputPath, pageHtml);
    } else if (item.endsWith('.html')) {
      // Copy HTML files directly
      fs.copySync(sourcePath, path.join(targetPath, item));
    }
  });
}

function applyLayout(layoutName, data) {
  if (!layouts[layoutName]) {
    console.warn(`Layout "${layoutName}" not found, using default`);
    layoutName = 'default';
    
    if (!layouts[layoutName]) {
      return `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${data.title || 'Page'}</title>
          <link rel="stylesheet" href="/assets/css/styles.css">
        </head>
        <body>
          ${data.content}
          <script src="/assets/js/main.js"></script>
        </body>
      </html>`;
    }
  }
  
  let html = layouts[layoutName];
  
  // Replace template variables
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
      let displayValue = value;
      // Format date if it's a date string
      if (key === 'date' && typeof value === 'string') {
        try {
          const dateObj = new Date(value);
          if (!isNaN(dateObj.getTime())) {
            displayValue = dateObj.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
          }
        } catch (e) {
          console.warn(`Could not format date: ${value}`);
        }
      }
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      html = html.replace(regex, displayValue);
    }
  });
  
  // Process conditional expressions for author
  if (data.author) {
    html = html.replace(/\{\{\s*author\s*\?\s*`[^`]*`\s*:\s*''\s*\}\}/g, 
      `<span class="author">by ${data.author}</span>`);
  } else {
    html = html.replace(/\{\{\s*author\s*\?\s*`[^`]*`\s*:\s*''\s*\}\}/g, '');
  }
  
  // Process conditional expressions for tags
  if (data.tags && Array.isArray(data.tags)) {
    const tagsHtml = data.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    html = html.replace(/\{\{\s*tags\s*\?\s*tags\.map\([^)]*\)\.join\([^)]*\)\s*:\s*''\s*\}\}/g, tagsHtml);
  } else {
    html = html.replace(/\{\{\s*tags\s*\?\s*tags\.map\([^)]*\)\.join\([^)]*\)\s*:\s*''\s*\}\}/g, '');
  }
  
  // Handle special cases like blog posts list
  if (data.posts && Array.isArray(data.posts)) {
    let postsHtml = '';
    data.posts.forEach(post => {
      postsHtml += `
        <article class="post-preview">
          <h2><a href="${post.url}">${post.title}</a></h2>
          <div class="post-meta">
            <span class="date">${post.formattedDate || post.date || ''}</span>
            ${post.author ? `<span class="author">by ${post.author}</span>` : ''}
          </div>
          ${post.excerpt ? `<div class="excerpt">${post.excerpt}</div>` : ''}
          <a href="${post.url}" class="read-more">Read more</a>
        </article>
      `;
    });
    html = html.replace(/\{\{\s*posts\s*\}\}/g, postsHtml);
  }
  
  // Clean up any remaining template variables
  html = html.replace(/\{\{\s*\w+\s*\}\}/g, '');
  
  return html;
}
