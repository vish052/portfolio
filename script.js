document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Smooth Scrolling & Active Link Handling ---
    const links = document.querySelectorAll('.navbar a');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            if (targetId && targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    // Smooth scroll to target
                    window.scrollTo({
                        top: targetElement.offsetTop - 70, // Offset for fixed navbar
                        behavior: 'smooth'
                    });
                    
                    // Manually update active class immediately for better UX
                    links.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                }
            }
        });
    });

    // --- 2. Scroll Spy (Update Active Link on Scroll) ---
    window.addEventListener('scroll', () => {
        let currentSection = '';
        const sections = document.querySelectorAll('div[id$="-section"]');
        const scrollPosition = window.scrollY + 100; // Offset for navbar

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = '#' + section.getAttribute('id');
            }
        });

        // Only update if we found a section (handles top of page case)
        if (currentSection) {
            links.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === currentSection) {
                    link.classList.add('active');
                }
            });
        } else if (window.scrollY < 100) {
            // Highlighting home if at the very top
             links.forEach(l => l.classList.remove('active'));
             const homeLink = document.querySelector('a[href="#home-section"]');
             if(homeLink) homeLink.classList.add('active');
        }
    });

    // --- 3. Scroll Animations (Intersection Observer) ---
    const observerOptions = {
        threshold: 0.15, // Trigger when 15% of element is visible
        rootMargin: "0px 0px -50px 0px" // Offset slightly so it triggers before bottom
    };

    const animateOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing to play animation only once
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    // Select elements to animate
    const animatedElements = document.querySelectorAll(
        '.section-heading, .glass-card, .skill-card, .timeline-item, .profile-text, .img-box'
    );
    
    animatedElements.forEach(el => {
        el.classList.add('hidden-animate');
        animateOnScroll.observe(el);
    });
});

// --- 4. Resume Download Function ---
function download() {
    const pdfUrl = 'assets/Vishal Sharma - Full Stack-  Senior Software Engineer Resume - 8 years.pdf';
    
    // Check if file likely exists (client-side check is limited, but improves UX)
    // We'll simplisticly try to trigger it.
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'Vishal_Sharma_Resume.pdf'; // Clean filename for user
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

document.querySelectorAll('.nav-menu li a').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Theme Toggle Logic
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Check for saved user preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    body.classList.add('light-mode');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('light-mode');
    // Save preference
    if (body.classList.contains('light-mode')) {
        localStorage.setItem('theme', 'light');
    } else {
        localStorage.setItem('theme', 'dark');
    }
});

/* --- Robust Resume Chatbot --- */
class ChatBot {
    constructor() {
        // Default data (Offline fallback)
        this.data = {
            greeting: "Hello! I am the Resume Bot. Ask me anything about Vishal's work!",
            default: "I checked the resume, but I couldn't find that specific information. Try asking about Skills, Experience, Projects, or Contact.",
            skills: "I know JavaScript, React, Node.js, Python, SQL/NoSQL databases, and Cloud platforms (AWS/GCP).",
            experience: "Over 8 years of experience building enterprise-level applications, optimizing backend systems, and leading dev teams.",
            projects: "I worked on [Data Visualization Dashboards](#projects-section), Cloud Migration Tools, and High-Performance APIs.",
            contact: "Reach me at vishalsharmapks@gmail.com. Or uses the [Contact Form](#contact-section).",
            summary: "I am a 30-year-old Full Stack Developer specializing in scalable, cloud-native solutions."
        };
        
        this.init();
    }

    async init() {
        await this.fetchData();
        this.bindEvents();
    }

    async fetchData() {
        try {
            const response = await fetch('resume.json');
            if (response.ok) {
                const json = await response.json();
                this.data = { ...this.data, ...json };
                // console.log('ChatBot: Resume data loaded.'); // Debug log removed for production
            }
        } catch (e) {
            console.warn('ChatBot: Using offline data.', e);
        }
    }

    bindEvents() {
        this.widget = document.getElementById('chat-widget');
        this.window = document.getElementById('chat-window');
        this.messages = document.getElementById('chat-messages');
        this.input = document.getElementById('chat-input');
        
        // Buttons
        const toggleBtn = document.getElementById('chat-toggle-btn');
        const closeBtn = document.getElementById('chat-close-btn');
        const sendBtn = document.getElementById('chat-send-btn');
        
        // Bind logic with .bind(this) to keep context
        if (toggleBtn) toggleBtn.onclick = this.toggle.bind(this);
        if (closeBtn) closeBtn.onclick = this.toggle.bind(this);
        if (sendBtn) sendBtn.onclick = this.handleSend.bind(this);
        
        if (this.input) {
            this.input.onkeypress = (e) => {
                if (e.key === 'Enter') this.handleSend();
            };
        }
    }

    toggle() {
        this.window.classList.toggle('hidden-chat');
        if (!this.window.classList.contains('hidden-chat')) {
            this.input.focus();
            if (this.messages.children.length === 0) {
                this.addBotMessage(this.data.greeting);
                this.renderQuickOptions();
            }
        }
    }

    handleSend() {
        const text = this.input.value.trim();
        if (!text) return;
        
        this.addUserMessage(text);
        this.input.value = ''; // Clear input
        this.processQuery(text);
    }

    addUserMessage(text) {
        this.appendMessage(text, 'user-msg');
    }

    addBotMessage(text) {
        // Typing Indicator
        const typing = document.createElement('div');
        typing.className = 'typing-indicator';
        typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        this.messages.appendChild(typing);
        this.scrollToBottom();

        // Simulate reading/thinking
        setTimeout(() => {
            typing.remove();
            // Link formatter
            const formatted = text.replace(/\[([^\]]+)\]\(#([^\)]+)\)/g, '<a href="#$2" class="chat-link">$1</a>');
            this.appendMessage(formatted, 'bot-msg', true);
        }, 600);
    }

    appendMessage(content, type, isHTML = false) {
        const div = document.createElement('div');
        div.className = `message ${type}`;
        if (isHTML) div.innerHTML = content;
        else div.textContent = content;
        this.messages.appendChild(div);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    renderQuickOptions() {
        const opts = document.getElementById('quick-options');
        if(!opts) return;
        
        opts.innerHTML = '';
        ['Skills', 'Experience', 'Projects', 'Contact'].forEach(label => {
            const chip = document.createElement('div');
            chip.className = 'chip';
            chip.textContent = label;
            chip.onclick = () => {
                this.addUserMessage(label);
                this.processQuery(label);
            };
            opts.appendChild(chip);
        });
    }

    processQuery(query) {
        const q = query.toLowerCase();
        let answer = this.data.default;

        // Keyword Matcher (Strict Resume Mapping)
        if (q.includes('skill') || q.includes('stack') || q.includes('tech')) answer = this.data.skills;
        else if (q.includes('exp') || q.includes('work') || q.includes('job') || q.includes('year')) answer = this.data.experience;
        else if (q.includes('project') || q.includes('build') || q.includes('app')) answer = this.data.projects;
        else if (q.includes('contact') || q.includes('mail') || q.includes('call') || q.includes('hire')) answer = this.data.contact;
        else if (q.includes('summary') || q.includes('about') || q.includes('who')) answer = this.data.summary;
        else if (q.includes('hello') || q.includes('hi') || q.includes('hey')) answer = this.data.greeting;

        this.addBotMessage(answer);
    }
}

// Initialize safely
document.addEventListener('DOMContentLoaded', () => {
    window.chatBot = new ChatBot();
});
