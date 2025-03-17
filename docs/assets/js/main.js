document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const setupMobileMenu = () => {
    const navElement = document.querySelector('nav ul');
    const menuToggle = document.createElement('div');
    menuToggle.classList.add('menu-toggle');
    menuToggle.innerHTML = '<span></span><span></span><span></span>';
    
    document.querySelector('header .container').insertBefore(menuToggle, navElement);
    
    menuToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      navElement.classList.toggle('active');
    });
  };
  
  // Check if we need a mobile menu
  if (window.innerWidth <= 768) {
    setupMobileMenu();
  }
  
  window.addEventListener('resize', function() {
    if (window.innerWidth <= 768 && !document.querySelector('.menu-toggle')) {
      setupMobileMenu();
    }
  });
  
  // FAQ accordion
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  if (faqQuestions.length > 0) {
    faqQuestions.forEach(question => {
      question.addEventListener('click', () => {
        const answer = question.nextElementSibling;
        const isOpen = answer.style.display === 'block';
        
        // Close all answers
        document.querySelectorAll('.faq-answer').forEach(item => {
          item.style.display = 'none';
        });
        
        // Toggle the clicked answer
        if (!isOpen) {
          answer.style.display = 'block';
        }
      });
    });
    
    // Open the first FAQ item by default
    if (faqQuestions.length > 0) {
      faqQuestions[0].nextElementSibling.style.display = 'block';
    }
  }
  
  // Form submission handling
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(contactForm);
      const formValues = Object.fromEntries(formData.entries());
      
      // Here you would normally send this data to a server
      console.log('Form submitted with values:', formValues);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.classList.add('form-success');
      successMessage.textContent = 'Thank you for your message! We will get back to you soon.';
      
      contactForm.innerHTML = '';
      contactForm.appendChild(successMessage);
    });
  }
  
  // Subscribe form handling
  const subscribeForm = document.getElementById('subscribe-form');
  if (subscribeForm) {
    subscribeForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const emailInput = this.querySelector('input[type="email"]');
      const email = emailInput.value;
      
      // Here you would integrate with HubSpot or another email service
      console.log('Subscribe form submitted with email:', email);
      
      // Show success message
      const button = this.querySelector('button');
      const originalText = button.textContent;
      
      button.textContent = 'Subscribed!';
      button.disabled = true;
      
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        emailInput.value = '';
      }, 3000);
    });
  }
});
