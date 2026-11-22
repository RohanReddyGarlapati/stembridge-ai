# STEMBridge AI release catalog verification

Status: pending human review. Source: [RESOURCE_RESEARCH.md](RESOURCE_RESEARCH.md), §3 and §5.

Review the [candidate careers](../data/candidate/careers.json) and [candidate resources](../data/candidate/resources.json) before promotion. Each candidate resource omits `verifiedAt` until someone has checked it.

For each item, open the exact URL and confirm that the page loads, the title and provider match, the learning objective is supported, and the material is appropriate for teenagers. Check the actual cost, prerequisites, and any account or age restrictions. If an item fails, record the reason and leave it pending. Record the actual human check date in `YYYY-MM-DD` and copy it to the matching resource's `verifiedAt` only after it passes.

Pay particular attention to account or participation requirements for CyLab Security Academy, iNaturalist, OpenLearn, and GLOBE. The research notes archived or older materials for Seeing Theory and MIT 2.12 and a revision to watch for in NIST's AI Risk Management Framework.

Before release, confirm all 34 reviews are complete and were performed within 14 days of release. After human approval and promotion, run the release-mode catalog checks and the link check when its implementation is available.

1. [x] **CS50's Introduction to Computer Science** (`cs50x`)
   - URL: [https://cs50.harvard.edu/x/](https://cs50.harvard.edu/x/)
   - Learning objective: Computational thinking, algorithms, data structures, C, Python, SQL and web basics.
   - Human verification date: `November 20, 2026`

2. [x] **CS50's Introduction to Programming with Python** (`cs50-python`)
   - URL: [https://cs50.harvard.edu/python/](https://cs50.harvard.edu/python/)
   - Learning objective: Python functions, loops, exceptions, libraries, **unit testing**, file I/O, regex and OOP.
   - Human verification date: `November 20, 2026`

3. [x] **Python for Everybody** (`py4e`)
   - URL: [https://www.py4e.com/](https://www.py4e.com/)
   - Learning objective: Python fundamentals through lessons, a free textbook and autograded exercises.
   - Human verification date: `November 20, 2026`

4. [x] **The Python Tutorial** (`python-tutorial`)
   - URL: [https://docs.python.org/3/tutorial/](https://docs.python.org/3/tutorial/)
   - Learning objective: The official tour of the language: control flow, data structures, modules, errors, classes, virtual environments.
   - Human verification date: `November 20, 2026`

5. [x] **The Missing Semester of Your CS Education** (`missing-semester`)
   - URL: [https://missing.csail.mit.edu/](https://missing.csail.mit.edu/)
   - Learning objective: Command line, shell, Git, debugging, profiling and development environments.
   - Human verification date: `November 20, 2026`

6. [x] **Pro Git (2nd Edition)** (`pro-git`)
   - URL: [https://git-scm.com/book/en/v2](https://git-scm.com/book/en/v2)
   - Learning objective: Version control: commits, branching, remotes and collaboration on GitHub.
   - Human verification date: `November 21, 2026`

7. [x] **Learn web development** (`mdn-learn-web`)
   - URL: [https://developer.mozilla.org/en-US/docs/Learn_web_development](https://developer.mozilla.org/en-US/docs/Learn_web_development)
   - Learning objective: HTML, CSS, JavaScript, accessibility and web fundamentals in a structured path.
   - Human verification date: `November 21, 2026`

8. [x] **The Odin Project** (`odin-project`)
   - URL: [https://www.theodinproject.com/](https://www.theodinproject.com/)
   - Learning objective: Project-based full-stack JavaScript or Ruby on Rails curriculum.
   - Human verification date: `November 21, 2026`

9. [x] **Software Engineering at Google** (`swe-at-google`)
   - URL: [https://abseil.io/resources/swe-book](https://abseil.io/resources/swe-book)
   - Learning objective: How large teams keep code healthy: code review, testing, documentation, dependency management.
   - Human verification date: `November 21, 2026`


10. [x] **Elements of AI** (`elements-of-ai`)
   - URL: https://www.elementsofai.com/
   - Learning objective: What AI is, what it can and cannot do, and its effects on society. No math or code needed for Part 1.
   - Human verification date: `2026-11-21`
   - Status: Approved for publicly readable introductory lessons.
   - Cost: Free.
   - Account: Not required for reading lessons; required for exercises.
   - Age restrictions: Exercise account eligibility not confirmed; exercises are optional for this learning objective.


11. [x] **Ethics of AI** (`ethics-of-ai`)
   - URL: [https://ethics-of-ai.mooc.fi/](https://ethics-of-ai.mooc.fi/)
   - Learning objective: Accountability, transparency, fairness, human rights, and AI ethics in practice.
   - Human verification date: `2026-11-21`
   - Status: Approved for publicly readable introductory lessons.
   - Cost: Free.
   - Account: Not required for reading lessons; required for exercises.
   - Age restrictions: Exercise account eligibility not confirmed; exercises are optional for this learning objective.


12. [x] **CS50 AI**
   - URL: https://cs50.harvard.edu/ai/
   - Learning objective: Study AI algorithms, search,
     machine learning, and Python project examples.
   - Human verification date: `2026-11-21`
   - Status: Approved for public learning materials.
   - Cost: Free.
   - Account: Not required for lectures; required
     for graded project submissions.
   - Difficulty: Intermediate.
   - Prerequisite: CS50x or substantial Python experience.



13. [x] **Google Machine Learning Crash Course**
   - URL: https://developers.google.com/machine-learning/crash-course
   - Learning objective: Learn machine learning fundamentals,
     including regression, classification, and neural networks.
   - Human verification date: `2026-11-21`
   - Status: Approved for public learning materials.
   - Cost: Free.
   - Account: Not needed for lessons; some Colab programming
     exercises may require sign-in.
   - Difficulty: Intermediate.
   - Prerequisites: Python, algebra, and basic statistics.


14. [x] **Practical Deep Learning for Coders (fast.ai)**
   - URL: https://course.fast.ai/
   - Learning objective: Understand practical deep learning
     concepts through public lectures and examples.
   - Human verification date: `2026-11-21`
   - Status: Approved for public learning materials.
   - Cost: Free lectures and online materials.
   - Account: Not required for lectures; Kaggle or another
     notebook account may be needed for hands-on exercises.
   - Difficulty: Intermediate.
   - Prerequisites: Python and basic mathematics.



15. [x] **Hugging Face LLM Course**
   - URL: https://huggingface.co/learn/llm-course
   - Learning objective: Understand Transformers, NLP,
     tokenization, and large language models.
   - Human verification date: `2026-11-21`
   - Status: Approved for publicly accessible lessons.
   - Cost: Free.
   - Account: Not required for reading; some practical
     activities may require login or external services.
   - Difficulty: Intermediate–advanced.
   - Prerequisites: Python and introductory deep learning.


16. [x] **NIST AI Risk Management Framework**
   - URL: https://www.nist.gov/itl/ai-risk-management-framework
   - Learning objective: Understand trustworthy AI
     AI risk identification and risk management.
   - Human verification date: `2026-11-21`
   - Status: Approved for guided reading of AI RMF 1.0.
   - Cost: Free.
   - Account: Not required.
   - Difficulty: Intermediate–advanced.
   - Prerequisites: Introductory AI concepts.
   - Version note: AI RMF 1.0 (2023); revision underway.


17. [x] **Seeing Theory** (`seeing-theory`)
   - URL: https://seeing-theory.brown.edu/
   - Learning objective: Understand probability and statistics
     through interactive visualizations.
   - Human verification date: `2026-11-21`
   - Status: Approved for introductory probability learning.
   - Cost: Free.
   - Account: Not required.
   - Difficulty: Beginner–intermediate.
   - Maintenance note: Archived educational resource;
     no longer actively maintained.



18. [x] **OpenIntro Statistics** (`openintro-statistics`)
   - URL: https://www.openintro.org/book/os/
   - Learning objective: Introductory statistics and data analysis.
   - Human verification date: `2026-11-21`
   - Status: Approved for students with basic algebra
     and graph-reading skills.
   - Cost: Free PDF; printed edition optional.
   - Account: Not required.
   - Difficulty: Beginner–intermediate.


19. [x] **Linear Algebra (18.06)** (`mit-18-06-linear-algebra`)
   - URL: [https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/)
   - Human verification date: `2026-11-21`



20. [x] **Data Analysis and Visualization in Python for Ecologists** (`data-carpentry-python-ecology`)
   - URL: [https://datacarpentry.github.io/python-ecology-lesson/](https://datacarpentry.github.io/python-ecology-lesson/)
   - Learning objective: Load, clean, combine, and plot real ecological survey data with pandas.
   - Human verification date: `2026-11-21`
   - Review lesson: https://datacarpentry.github.io/python-ecology-lesson/01-short-introduction-to-Python.html


21. [x] **Getting Started with scikit-learn** (`scikit-learn-getting-started`)
   - URL: [https://scikit-learn.org/stable/getting_started.html](https://scikit-learn.org/stable/getting_started.html)
   - Learning objective: Fitting estimators, building pipelines, cross-validation, and parameter tuning.
   - Human verification date: `2026-11-21`
   - Review notes: Official documentation is free and readable without registration. Estimator fitting, pipelines, cross-validation and parameter tuning are covered. Appropriate for teenagers with Python and introductory machine learning knowledge. Code execution was not tested.


22. [x] **CS50's Introduction to Cybersecurity** (`cs50-cybersecurity`)
   - URL: [https://cs50.harvard.edu/cybersecurity/](https://cs50.harvard.edu/cybersecurity/)
   - Learning objective: Securing accounts, data, systems, and software; privacy; recognizing and weighing threats.
   - Human verification date: `2026-11-21`
   - Review notes: Week 0 lecture verified as accessible and playable without payment or registration. Suitable for teenagers aged 14–18. Beginner-friendly; no programming prerequisite. Course covers accounts, data, systems, software, and privacy. An edX account is required to submit assignments for feedback.


23. [x] **Bandit Wargame** (`overthewire-bandit`)
   - URL: [https://overthewire.org/wargames/bandit/](https://overthewire.org/wargames/bandit/)
   - Learning objective: Command-line fundamentals through progressive puzzle levels.
   - Human verification date: `2026-11-21`
   - Review notes: Level 0 instructions are publicly accessible without payment or registration. Successfully connected to the game server using SSH. Suitable for teenagers aged 14–18 with guidance and basic terminal preparation. Requires internet connectivity and an SSH-capable terminal. Later levels were not individually tested.



24. [x] **Better Hacker** (`better-hacker`)
   - URL: [https://betterhacker.org/](https://betterhacker.org/)
   - Learning objective: Learn introductory cybersecurity concepts, including threats, vulnerabilities, networking, and web security, through guided lessons, knowledge checks, and simulated defensive activities.
   - Human verification date: `2026-11-22`
   - Review notes: Replaces CyLab Security Academy. Lesson 1 was verified as accessible, and a knowledge check or guided simulation was tested successfully. Free without payment or registration. Suitable for teenagers aged 14–18. Browser-based activities use fictional scenarios; the complete curriculum was not individually tested.
   - Recommended placement: Beginner cybersecurity pathway, after digital safety fundamentals and before advanced practical challenges.


25. [x] **CYBER.ORG — Keys to Cybersecurity** (`cyber-org-keys`)
   - URL: [https://cyber.org/cyber-keys](https://cyber.org/cyber-keys)
   - Learning objective: Understand introductory cybersecurity risks and protective practices, including phishing, online threats, authentication, defense in depth and protecting connected devices, through interactive educational activities.
   - Human verification date: `2026-11-22`
   - Review notes: Replaces OWASP Top 10, which did not pass the original teen-suitability review. Advanced Key lesson content and an interactive activity were verified accessible and functional without payment or registration. Suitable for teenagers aged 14–18 as introductory or refresher material. The Keys were originally designed primarily for grades 3–8; the full curriculum was not individually tested.
   - Recommended placement: Introductory cybersecurity and digital safety pathway.


26. [x] **Cybersecurity Framework** (`nist-csf`)
   - URL: [https://www.nist.gov/cyberframework](https://www.nist.gov/cyberframework)
   - Learning objective: How organizations identify, protect, detect, respond to and recover from cyber risk (CSF 2.0).
   - Human verification date: `2026-11-21`
   - Review notes: CSF 2.0 introduction and all six functions (Govern, Identify, Protect, Detect, Respond, Recover) are publicly accessible without payment or registration. Suitable for teenagers aged 14–18 who have basic cybersecurity knowledge, as guided or advanced reading. Full organizational implementation was not tested.


27. [x] **Lessons in Electric Circuits** (`all-about-circuits-textbook`)
   - URL: [https://www.allaboutcircuits.com/textbook/](https://www.allaboutcircuits.com/textbook/)
   - Learning objective: DC and AC circuits, semiconductors and digital logic, from first principles.
   - Human verification date: `2026-11-22`
   - Review notes: Corrected introductory DC lesson and circuit diagrams verified accessible. Free to read without registration. Suitable for teenagers with basic mathematical preparation. The textbook includes sections on DC, AC, semiconductor, and digital circuits. Recommend supervised low-voltage activities; advanced electrical experiments require additional safety precautions.
   - Verified lesson: https://www.allaboutcircuits.com/textbook/direct-current/chpt-1/electric-circuits/

28. [x] **Introduction to Robotics (2.12)** (`mit-2-12-intro-robotics`)
   - URL: [https://ocw.mit.edu/courses/2-12-introduction-to-robotics-fall-2005/](https://ocw.mit.edu/courses/2-12-introduction-to-robotics-fall-2005/)
   - Learning objective: Robot mechanisms, kinematics, dynamics, control, actuators, and sensors.
   - Human verification date: `2026-11-22`
   - Review notes: MIT OpenCourseWare Chapter 1 and diagrams verified readable without payment or registration. Suitable for mathematically prepared older teenagers as advanced guided reading. Requires substantial preparation in calculus, physics, and linear algebra; prior knowledge of dynamics and control is beneficial. Course materials date from Fall 2005 and may be incomplete. Advanced lectures, assignments, and experiments were not individually tested.
   - Recommended placement: Optional advanced robotics milestone after mathematics, physics, programming, and introductory robotics.


29. [x] **Modern Robotics: Mechanics, Planning, and Control** (`modern-robotics`)
   - URL: [https://modernrobotics.northwestern.edu/](https://modernrobotics.northwestern.edu/)
   - Learning objective: Configuration space, kinematics, dynamics, motion planning and control, through video lectures.
   - Human verification date: `2026-11-22`
   - Review notes: Official Northwestern University video lessons verified accessible and playable without payment or registration. Suitable for mathematically prepared older teenagers as advanced guided learning. Recommended prerequisites include physics, linear algebra, calculus and programming. The original textbook PDF returned HTTP 403 Forbidden during human verification. Videos were tested; supplementary code was not independently verified.
   - Recommended placement: Advanced robotics specialization after introductory robotics, mathematics and programming.



30. [x] **Introducing the environment: Ecology and ecosystems** (`openlearn-ecology`)
   - URL: [https://www.open.edu/openlearn/nature-environment/environmental-studies/introducing-the-environment-ecology-and-ecosystems/content-section-0](https://www.open.edu/openlearn/nature-environment/environmental-studies/introducing-the-environment-ecology-and-ecosystems/content-section-0)
   - Learning objective: How ecosystems work and how scientists study human effects on them.
   - Human verification date: `2026-11-22`
   - Review notes: Course introduction and ecosystem lessons verified readable without payment or registration. Content covers ecosystem relationships and scientific study of human environmental impacts. Suitable for teenagers aged 14–18. Some quizzes, progress tracking, and participation recognition may require a free OpenLearn account; these features were not tested.
   - Recommended placement: Environmental Scientist pathway, after basic biology and before environmental data collection.


31. [x] **iNaturalist** (`inaturalist`)
   - URL: [https://www.inaturalist.org/](https://www.inaturalist.org/)
   - Learning objective: Explore public wildlife observations, identify species, and examine biodiversity patterns.
   - Human verification date: `2026-11-22`
   - Registration: Free account required to contribute observations; not required for browsing.
   - Review notes: Public observations verified as accessible and appropriate for teenagers, with privacy guidance. Uploading observations was not tested.
   - Status: Approved for public biodiversity exploration.

32. [x] **The GLOBE Program** (`globe-program`)
   - URL: [https://www.globe.gov/](https://www.globe.gov/)
   - Learning objective: Understand standardized environmental measurement methods for air, water, soil, and land cover through public protocols.
   - Human verification date: `2026-11-22`
   - Registration: An account is required to submit observations. Some protocols require training.
   - Review notes: Public measurement instructions verified as accessible and suitable for teenagers with guidance. Data submission was not tested.
   - Status: Approved for public protocol learning.

33. [x] **NASA Earth Observatory** (`nasa-earth-observatory`)
   - URL: [https://science.nasa.gov/earth/earth-observatory](https://science.nasa.gov/earth/earth-observatory)
   - Learning objective: Satellite images and articles explaining changes in Earth's land, oceans, and atmosphere.
   - Human verification date: `2026-11-22`
   - Review notes: NASA satellite imagery, explanatory articles, and image captions verified as accessible without payment or registration. Content covers environmental changes involving Earth's land, oceans, and atmosphere. Suitable for teenagers aged 14–18 with basic knowledge of Earth science. No account or specialized software required for reading and visual exploration.
   - Recommended placement: Environmental Scientist pathway, after introductory Earth science and ecology.

