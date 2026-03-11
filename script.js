document.addEventListener('DOMContentLoaded', () => {
    
    // --- Theme Toggle Logic ---
    const themeBtn = document.getElementById('theme-toggle');
    const sunIcon = themeBtn.querySelector('.sun-icon');
    const moonIcon = themeBtn.querySelector('.moon-icon');
    
    const getPreferredTheme = () => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            return storedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const setTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        if (theme === 'dark') {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    };

    // Initialize Theme
    setTheme(getPreferredTheme());

    themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        setTheme(currentTheme === 'light' ? 'dark' : 'light');
    });

    // --- Greeting Alert ---
    const showGreeting = () => {
        // Changed key so it shows up again for the user
        if (!sessionStorage.getItem('hasSeenGreetingV2')) {
            const overlay = document.createElement('div');
            overlay.className = 'greeting-overlay';
            overlay.innerHTML = `
                <div class="greeting-modal">
                    <h2>Welcome to my Portfolio! 👋</h2>
                    <p>I'm thrilled you're here. Feel free to explore my work and experience.</p>
                    <button class="btn btn-primary" id="close-greeting">Awesome, let's explore!</button>
                </div>
            `;
            document.body.appendChild(overlay);

            // Close functionality
            const closeBtn = document.getElementById('close-greeting');
            closeBtn.addEventListener('click', () => {
                overlay.classList.add('fade-out');
                setTimeout(() => {
                    overlay.remove();
                    // Trigger custom event so Mascot knows to start
                    window.dispatchEvent(new Event('welcomeModalClosed'));
                }, 400); // Wait for fade transition
            });

            sessionStorage.setItem('hasSeenGreetingV2', 'true');
        } else {
            // Already seen, start Mascot immediately
            setTimeout(() => {
                window.dispatchEvent(new Event('welcomeModalClosed'));
            }, 500);
        }
    };

    // Delay slightly for better UX
    setTimeout(showGreeting, 800);

    // --- Mobile Menu Logic ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    const toggleMenu = () => {
        const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
        mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
        mobileNav.classList.toggle('open');
        document.body.style.overflow = isExpanded ? '' : 'hidden'; // Prevent scrolling
    };

    mobileMenuBtn.addEventListener('click', toggleMenu);

    // Close mobile menu when a link is clicked
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mobileNav.classList.contains('open')) {
                toggleMenu();
            }
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileNav.classList.contains('open') && !mobileNav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            toggleMenu();
        }
    });

    // --- Header Scroll Logic & Scroll Spy ---
    const header = document.getElementById('header');
    const backToTopBtn = document.getElementById('back-to-top');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        // Sticky Header & Shadow
        if (scrollY > 50) {
            header.classList.add('scrolled');
            backToTopBtn.classList.add('visible');
        } else {
            header.classList.remove('scrolled');
            backToTopBtn.classList.remove('visible');
        }

        // Scroll Spy active navigation link
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100; // Offset for sticky header
            const sectionId = section.getAttribute('id');
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });

    // Back to top button functionality
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // --- Scroll Reveal Animations (IntersectionObserver) ---
    const revealElements = document.querySelectorAll('.reveal-up, .skill-bar-fill');

    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            
            const target = entry.target;
            
            if (target.classList.contains('reveal-up')) {
                target.classList.add('visible');
            } else if (target.classList.contains('skill-bar-fill')) {
                // Animate skill bar width
                const targetWidth = target.getAttribute('data-width');
                target.style.width = targetWidth;
            }
            
            observer.unobserve(target); // Only animate once
        });
    }, revealOptions);

    revealElements.forEach(el => {
        revealOnScroll.observe(el);
    });

    // --- Modal Logic ---
    const modal = document.getElementById('project-modal');
    const closeBtn = document.getElementById('close-modal');
    const viewDetailsBtns = document.querySelectorAll('.view-details-btn');
    
    // Elements to populate inside modal
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalTechList = document.getElementById('modal-tech');
    
    // Mock Data for Projects (Normally fetched from JSON or embedded in data attributes)
    const projectData = {
        "project-1": {
            title: "🏭 Manufacturing Floor Assistant",
            desc: "The Manufacturing Floor Assistant is a real-time multilingual communication tool designed to improve clarity and reduce miscommunication in diverse manufacturing environments. The application captures live speech from supervisors and technicians, converts it into accurate text using Speech-to-Text, and instantly translates the output into 20+ languages to support cross-language collaboration on the shop floor.\n\nBuilt for noisy, fast-paced production settings, the system focuses on low-latency transcription and translation so teams can act quickly without disrupting operations. It supports manufacturing-specific terminology and standard work instructions, helping improve task accuracy, safety compliance, and operational efficiency.\n\nThe solution also enables better documentation and traceability by storing transcripts (and translated text if required) for audits, shift handovers, and continuous improvement initiatives. Deployed on tablets or mobile devices, it provides an accessible, hands-on assistant that bridges communication gaps and helps teams stay aligned in real time.",
            tech: ["React", "Node.js (REST + WebSockets)", "Google Speech-to-Text", "LLM-based translation via Gemini", "WebSockets", "GCP", "BigQuery", "Cloud Storage"]
        },
        "project-2": {
            title: "🤖 Autonomous GenAI Agents (Human-on-the-Loop)",
            desc: "This solution delivers a suite of autonomous Generative AI agents designed around real enterprise personas (e.g., demand planner, supply chain analyst). Each agent combines LLM reasoning with enterprise data signals to automate complex, high-effort workflows — while keeping humans in control through human-on-the-loop validation and escalation.\n\nDeployed on GCP, the agents integrate with data sources (BigQuery/SQL) to generate insights, recommendations, and actionable alerts. The framework supports governed execution through auditability, monitoring, and feedback loops to continuously improve quality and trust. The result is a scalable agentic platform that accelerates operational decisions, improves forecast outcomes, and proactively surfaces supply chain risks and opportunities.",
            tech: ["Google Cloud Platform (GCP)", "Vertex AI / LLM APIs", "Google Adk", "Node.js (APIs, orchestration services)", "BigQuery", "Cloud Functions", "Logging, audit trails, prompt/version tracking, HITL controls"]
        },
        "project-3": {
            title: "📦 Distress Inventory Companion",
            desc: "Distress Inventory Companion was built to help supply chain and commercial teams proactively reduce distressed sales by accelerating root-cause analysis and decision-making. The solution connects to enterprise inventory, demand, and supply signals to identify where and why distress is occurring (e.g., forecasting gaps, replenishment issues, excess inventory, distribution constraints), then generates data-backed recommendations to recover value.\n\nHosted on GCP and powered by Generative AI, the co-pilot guides users through a structured workflow: it summarizes exceptions, surfaces contributing factors, suggests next-best actions (markdown/discount strategy, transfer/redistribution, targeted promotions), and supports consistent documentation for faster approvals and follow-through. The result is a scalable, analytics-driven assistant that reduces manual analysis time and improves margin recovery.",
            tech: ["Google Cloud Platform (GCP)", "Vertex AI / LLM APIs", "Custom workflow orchestration", "Node.js (APIs, orchestration)", "BigQuery", "Cloud Functions / Cloud Run Jobs", "Logging, metrics, audit trails"]
        },
        "project-4": {
            title: "📈 Demand Planning Companion",
            desc: "Demand Planning Companion was designed to help planners manage large portfolios and complex forecasting scenarios—especially where long lead times and multiple constraints make analysis slow and error-prone. The co-pilot connects to enterprise planning and supply chain datasets to surface key drivers, anomalies, and risks, then translates them into clear, actionable insights through a natural language interface.\n\nBuilt on GCP with a custom workflow layer and Generative AI, the solution guides planners through scenario exploration, highlights changes vs. historical patterns, explains likely drivers, and supports faster decision-making with consistent recommendations. By reducing manual effort and making insights more accessible, the companion enables planners to work more efficiently across large portfolios while improving confidence in forecast sign-off.",
            tech: ["Google Cloud Platform (GCP)", "Vertex AI / LLM APIs", "Custom planning workflow orchestration", "Node.js (APIs, orchestration layer)", "BigQuery", "Logging, usage metrics, audit trails, feedback loop"]
        },
        /* "project-5": {
            title: "CSV Parser & Analyzer",
            desc: "A fast, client-side only tool to parse large CSV files and generate basic statistical summaries securely in the browser without sending data to a server.",
            tech: ["Web Workers", "JavaScript", "File API"]
        },
        "project-6": {
            title: "Minimalist To-Do",
            desc: "A beautifully designed, keyboard-accessible to-do application focusing on sleek animations and a distraction-free environment.",
            tech: ["HTML/CSS", "JS Modules", "Web Animations API"]
        } */
    };

    const openModal = (projectId) => {
        const data = projectData[projectId];
        if (data) {
            modalTitle.textContent = data.title;
            modalDesc.textContent = data.desc;
            
            // Populate Tech Stack
            modalTechList.innerHTML = '';
            data.tech.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                modalTechList.appendChild(li);
            });
            
            modal.showModal();
            document.body.style.overflow = 'hidden'; // prevent bg scroll
        }
    };

    const closeModal = () => {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.close();
            modal.classList.remove('closing');
            document.body.style.overflow = '';
        }, 200); // slight delay for animation if needed
    };

    viewDetailsBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const projectId = btn.getAttribute('data-project');
            openModal(projectId);
        });
    });

    closeBtn.addEventListener('click', closeModal);

    // Close dialog when clicking on backdrop
    modal.addEventListener('click', (e) => {
        const dialogDimensions = modal.getBoundingClientRect();
        if (
            e.clientX < dialogDimensions.left ||
            e.clientX > dialogDimensions.right ||
            e.clientY < dialogDimensions.top ||
            e.clientY > dialogDimensions.bottom
        ) {
            closeModal();
        }
    });

    // --- Contact Form Validation & Mock Submit ---
    // form removed in previous commit
    /* 
    const contactForm = document.getElementById('contact-form');
    const formSuccess = document.getElementById('form-success');
    const submitBtn = document.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('span');
    const loader = submitBtn.querySelector('.loader');

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // ... (removed obsolete form validation)
    });
    */

    // --- Number Counter Animation ---
    const numberElements = document.querySelectorAll('.highlight-number, .stat-number');
    
    // Function to animate a single number element
    const animateNumber = (element) => {
        // Extract the target number and any text around it from the stored data attribute
        const text = element.getAttribute('data-target');
        if (!text) return;
        
        // Match numbers, decimals, and commas
        const match = text.match(/([\d,.]+)/);
        
        if (!match) return; // If no number found, don't animate
        
        const targetNumberStr = match[1];
        // Parse the number, removing commas for calculation
        const targetNumber = parseFloat(targetNumberStr.replace(/,/g, ''));
        
        // Find prefix and suffix (e.g., '+', 'M', '%')
        const [prefix, suffix] = text.split(targetNumberStr);
        
        // Start counter at 1 (or 0 if target is less than 1)
        let currentNumber = targetNumber >= 1 ? 1 : 0;
        
        // Define animation duration based on target size, capped at a maximum of 2000ms
        const duration = 2000; 
        const frameRate = 1000 / 60; // 60 FPS
        const totalFrames = duration / frameRate;
        const increment = (targetNumber - currentNumber) / totalFrames;
        
        // Update function
        const updateNumber = () => {
            currentNumber += increment;
            
            if (currentNumber < targetNumber) {
                // Determine if we need decimals (based on if the original string had decimals)
                const hasDecimals = targetNumberStr.includes('.');
                let displayStr;
                
                if (hasDecimals) {
                    const decimalPlaces = targetNumberStr.split('.')[1].length;
                    displayStr = currentNumber.toFixed(decimalPlaces);
                } else {
                    displayStr = Math.floor(currentNumber).toString();
                }

                element.innerText = `${prefix || ''}${displayStr}${suffix || ''}`;
                requestAnimationFrame(updateNumber);
            } else {
                // Ensure the final value is exactly the target text
                element.innerText = text;
            }
        };
        
        // Start animation loop
        requestAnimationFrame(updateNumber);
    };

    // Use Intersection Observer to trigger when visible
    const numberObserverOptions = {
        threshold: 0.5, // Trigger when 50% of the element is visible
        rootMargin: "0px 0px -50px 0px"
    };

    const numberObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateNumber(entry.target);
                // Unobserve after animating once
                observer.unobserve(entry.target);
            }
        });
    }, numberObserverOptions);

    numberElements.forEach(el => {
        // Store original text
        const text = el.innerText;
        el.setAttribute('data-target', text);
        
        // Prepare element for animation by setting its initial state to 1 (or 0)
        const match = text.match(/([\d,.]+)/);
        if(match) {
             const [prefix, suffix] = text.split(match[1]);
             const startVal = parseFloat(match[1].replace(/,/g, '')) >= 1 ? 1 : 0;
             el.innerText = `${prefix || ''}${startVal}${suffix || ''}`;
        }
        
        numberObserver.observe(el);
    });

    // --- Anti-Scraping & Inspect Element Deterrents ---
    // Disable Right Click
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Disable Common Developer Tools Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // Prevent F12
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        // Prevent Ctrl+Shift+I (Elements) and Ctrl+Shift+J (Console) and Ctrl+Shift+C (Inspect)
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
            e.preventDefault();
            return false;
        }
        // Prevent Ctrl+U (View Source)
        if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
            e.preventDefault();
            return false;
        }
        // Prevent Cmd+Option+I for Mac
        if (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'I')) {
            e.preventDefault();
            return false;
        }
    });

    // --- PRO Cursor-Following Mascot Logic ---
    const petMascot = document.getElementById('pet-mascot');
    const pupils = document.querySelectorAll('.pet-pupil');
    const petBubble = document.getElementById('pet-bubble');
    const petBody = document.querySelector('.pet-body');

    if (petMascot && pupils.length > 0) {
        
        let bubbleTimeoutId = null;
        let sleepTimeoutId = null;
        let isSleeping = false;

        // Custom Greeting on Load based on time, waiting for Modal if first visit
        window.addEventListener('welcomeModalClosed', () => {
            const hour = new Date().getHours();
            let greeting = "Hello there! Welcome to my boss's portfolio! 👋";
            if (hour < 12) greeting = "Good morning! Welcome to my boss's portfolio! ☀️";
            else if (hour < 18) greeting = "Good afternoon! Welcome to my boss's portfolio! 🚀";
            else greeting = "Good evening! Welcome to my boss's portfolio! 🌙";
            
            showBubble(greeting, 4000);
            
            // Second greeting for new landers
            setTimeout(() => {
                if (!isPlayingGame && !isSleeping) {
                    showBubble("Hover over my favorite projects! 🚀", 4000, "loved");
                }
            }, 4500);

            resetSleepTimer();
        });

        // Core visual update function for eyes
        const updateEyes = (e) => {
            if (isSleeping) return; // Don't move eyes if sleeping

            pupils.forEach((pupil) => {
                const eye = pupil.parentElement;
                const rect = eye.getBoundingClientRect();
                
                // Calculate eye center
                const eyeCenterX = rect.left + rect.width / 2;
                const eyeCenterY = rect.top + rect.height / 2;
                
                // Calculate angle from eye to cursor
                const angle = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);
                
                // Calculate max distance pupil can move within the eye
                const maxMove = (rect.width - pupil.offsetWidth) / 2;
                
                const pupilX = Math.cos(angle) * maxMove;
                const pupilY = Math.sin(angle) * maxMove;
                
                pupil.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
            });
        };

        // Sleep Logic
        const wakeUp = (e) => {
            if (isSleeping) {
                isSleeping = false;
                petBubble.classList.remove('show'); // Hide Zzz
                
                // Open eyes
                document.querySelectorAll('.pet-eye').forEach(eye => {
                    eye.style.height = '18px';
                    eye.style.borderTop = 'none';
                });
                
                showBubble("Whoa, I'm awake! 👀", 2000);
            }
            updateEyes(e);
            resetSleepTimer();
        };

        const goToSleep = () => {
            isSleeping = true;
            // Close eyes via CSS
            document.querySelectorAll('.pet-eye').forEach(eye => {
                eye.style.height = '4px';
                eye.style.borderTop = '2px solid #0a192f';
            });
            // Center pupils
            pupils.forEach(pupil => {
                pupil.style.transform = `translate(0px, 0px)`;
            });
            
            showBubble("Zzz... 😴", 999999); // Stay asleep until move
        };

        const resetSleepTimer = () => {
            clearTimeout(sleepTimeoutId);
            sleepTimeoutId = setTimeout(goToSleep, 10000); // Sleep after 15 seconds of inactivity
        };

        // Track Mouse
        document.addEventListener('mousemove', wakeUp);

        // Speech Bubble UI logic
        const showBubble = (text, duration = 3000, extraClass = null) => {
            petBubble.innerHTML = text; // allow HTML like emojis
            petBubble.classList.add('show');
            petMascot.classList.add('excited');
            if (extraClass) petMascot.classList.add(extraClass);
            
            clearTimeout(bubbleTimeoutId);
            bubbleTimeoutId = setTimeout(() => {
                petBubble.classList.remove('show');
                petMascot.classList.remove('excited');
                if (extraClass) petMascot.classList.remove(extraClass);
            }, duration); 
        };

        // Interactions based on clicks
        let clickCount = 0;
        let isPlayingGame = false;
        let gameInterval = null;
        let gameIdleTimeout = null;

        const stopGame = (message, win) => {
            isPlayingGame = false;
            clearInterval(gameInterval);
            clearTimeout(gameIdleTimeout);
            petMascot.style.position = 'fixed';
            petMascot.style.left = 'auto';
            petMascot.style.top = 'auto';
            petMascot.style.bottom = '2rem';
            petMascot.style.right = '5rem';
            petMascot.style.transform = 'none';
            showBubble(message, 4000, win ? "loved" : null);
            clickCount = 0;
        };

        const resetGameIdleTimer = () => {
            if(!isPlayingGame) return;
            clearTimeout(gameIdleTimeout);
            gameIdleTimeout = setTimeout(() => {
                stopGame("Boring... I'm going back. 🥱", false);
            }, 5000); // 5 seconds of idle stops the game
        };

        petBody.addEventListener('click', (e) => {
            if (isPlayingGame) {
                // Game logic
                clickCount++;
                resetGameIdleTimer();
                if (clickCount >= 5) {
                    stopGame("You caught me! You win! 🏆", true);
                } else {
                    showBubble(`Ouch! ${5 - clickCount} left! 🏃‍♂️`, 1000, "wiggling");
                }
                return;
            }

            showBubble("Thanks for the pet! ❤️", 2000, "loved");
            
            // Add squished animation
            petMascot.classList.add('squished');
            setTimeout(() => {
                petMascot.classList.remove('squished');
                // Do a little spin after squishing
                petBody.style.transform = "rotate(360deg) scale(1.1)";
                setTimeout(() => {
                    petBody.style.transform = "none";
                }, 500);
            }, 200);
        });

        // Secret Mini Game trigger
        petBody.addEventListener('dblclick', () => {
            if (isPlayingGame) return;
            
            isPlayingGame = true;
            clickCount = 0;
            showBubble("Catch me if you can! 🎮", 2000, "wiggling");
            resetGameIdleTimer();
            
            // Start jumping around
            gameInterval = setInterval(() => {
                const maxX = window.innerWidth - 100;
                const maxY = window.innerHeight - 100;
                
                const randomX = Math.floor(Math.random() * maxX);
                const randomY = Math.floor(Math.random() * maxY);
                
                petMascot.style.bottom = 'auto';
                petMascot.style.right = 'auto';
                petMascot.style.left = `${randomX}px`;
                petMascot.style.top = `${randomY}px`;
                
            }, 700); // Jumps every 700ms
        });

        document.addEventListener('mousemove', () => {
             resetGameIdleTimer();
        });

        // Advanced Context Awareness (Event Delegation)
        document.body.addEventListener('mouseover', (e) => {
            const target = e.target;
            
            // Skill Chips
            if (target.classList.contains('skill-chip')) {
                showBubble(`Ooh, I love ${target.innerText}! 🧠`, 2000, "loved");
            } 
            // Contact Buttons
            else if (target.closest('a[href^="mailto:"]')) {
                showBubble("Sending an email to the boss? ✉️", 3000, "wiggling");
            } else if (target.closest('a[href*="wa.me"]')) {
                showBubble("Say hello on WhatsApp! 💬", 3000, "wiggling");
            } else if (target.closest('a[href*="linkedin.com"]')) {
                showBubble("Let's connect on LinkedIn! 🤝", 3000, "wiggling");
            } 
            // Project Cards
            else if (target.closest('.featured-projects-card')) {
                showBubble("Wow! One of my flagship AI Agents! 🚀", 3000, "loved");
            } else if (target.closest('.project-card.regular')) {
                showBubble("Great project! Check the impact metrics! 📊", 3000, "wiggling");
            }
            // Nav Links
            else if (target.closest('.nav-link')) {
                const href = target.closest('.nav-link').getAttribute('href');
                switch(href) {
                    case '#about':
                        showBubble("Let me tell you about my boss! 👋", 3000, "loved");
                        break;
                    case '#skills':
                        showBubble("Check out his massive tech stack! 💻", 3000, "loved");
                        break;
                    case '#experience':
                        showBubble("Years of solid engineering right here! 🏢", 3000, "wiggling");
                        break;
                    case '#projects':
                        showBubble("Ooh, look at these cool projects! 🚀", 3000, "loved");
                        break;
                    case '#education':
                        showBubble("Smart and certified! 🎓", 3000, "wiggling");
                        break;
                    case '#achievements':
                        showBubble("10+ Deploys, 2M+ Lines, 5K+ Coffees! ☕", 4000, "loved");
                        break;
                    case '#contact':
                        showBubble("Let's get in touch! 📞", 3000, "wiggling");
                        break;
                }
            } else if (target.closest('.about-highlights')) {
                showBubble("Look at all that experience! 🌟", 3000, "loved");
            } else if (target.closest('.about-image-placeholder')) {
                showBubble("That's my creator! 👋", 3000, "loved");
            }
        });

        document.body.addEventListener('mouseout', (e) => {
            const target = e.target;
            
            // If we leave any of the trigger elements, clear the animations immediately.
            if (
                target.classList.contains('skill-chip') ||
                target.closest('a[href^="mailto:"]') ||
                target.closest('a[href*="wa.me"]') ||
                target.closest('a[href*="linkedin.com"]') ||
                target.closest('.featured-projects-card') ||
                target.closest('.project-card.regular') ||
                target.closest('.nav-link') ||
                target.closest('.about-highlights') ||
                target.closest('.about-image-placeholder')
            ) {
                 petMascot.classList.remove('loved');
                 petMascot.classList.remove('wiggling');
            }
        });
        
        // Scroll Awareness
        let scrollTimeout;
        window.addEventListener('scroll', () => {
             // Wake up on scroll too
             if(isSleeping) {
                 wakeUp({clientX: window.innerWidth/2, clientY: window.innerHeight/2});
             } else {
                 resetSleepTimer();
             }
             
             // Check if scrolling fast
             clearTimeout(scrollTimeout);
             scrollTimeout = setTimeout(() => {
                 // Stopped scrolling
             }, 150);
        });
    }

});
