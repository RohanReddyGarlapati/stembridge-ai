# STEMBridge AI release catalog verification

Status: all 33 resources passed human review on 2026-11-22. Source: [RESOURCE_RESEARCH.md](RESOURCE_RESEARCH.md), §3 and §5.

Review the [candidate careers](../data/candidate/careers.json) and [candidate resources](../data/candidate/resources.json) before promotion. The candidate catalog records the actual review date for each resource in `verifiedAt`.

For each item, open the exact URL and confirm that the page loads, the title and provider match, the learning objective is supported, and the material is appropriate for teenagers. Check the actual cost, prerequisites, and any account or age restrictions. If an item fails, record the reason and leave it pending. Record the actual human check date in `YYYY-MM-DD` and copy it to the matching resource's `verifiedAt` only after it passes.

Pay particular attention to account or participation requirements for CyLab Security Academy, iNaturalist, OpenLearn, and GLOBE. The research notes archived or older materials for Seeing Theory and MIT 2.12 and a revision to watch for in NIST's AI Risk Management Framework.

Before release, confirm all 33 reviews are complete and were performed within 14 days of release. After human approval and promotion, run the release-mode catalog checks and `npm run check-links`.

1. [x] **CS50's Introduction to Computer Science** (`cs50x`)
   - URL: [https://cs50.harvard.edu/x/](https://cs50.harvard.edu/x/)
   - Learning objective: Computational thinking, algorithms, data structures, C, Python, SQL and web basics.
   - Human verification date: `2026-11-22`

2. [x] **CS50's Introduction to Programming with Python** (`cs50-python`)
   - URL: [https://cs50.harvard.edu/python/](https://cs50.harvard.edu/python/)
   - Learning objective: Python functions, loops, exceptions, libraries, **unit testing**, file I/O, regex and OOP.
   - Human verification date: `2026-11-22`

3. [x] **Python for Everybody** (`py4e`)
   - URL: [https://www.py4e.com/](https://www.py4e.com/)
   - Learning objective: Python fundamentals through lessons, a free textbook and autograded exercises.
   - Human verification date: `2026-11-22`

4. [x] **The Python Tutorial** (`python-tutorial`)
   - URL: [https://docs.python.org/3/tutorial/](https://docs.python.org/3/tutorial/)
   - Learning objective: The official tour of the language: control flow, data structures, modules, errors, classes, virtual environments.
   - Human verification date: `2026-11-22`

5. [x] **The Missing Semester of Your CS Education** (`missing-semester`)
   - URL: [https://missing.csail.mit.edu/](https://missing.csail.mit.edu/)
   - Learning objective: Command line, shell, Git, debugging, profiling and development environments.
   - Human verification date: `2026-11-22`

6. [x] **Pro Git (2nd Edition)** (`pro-git`)
   - URL: [https://git-scm.com/book/en/v2](https://git-scm.com/book/en/v2)
   - Learning objective: Version control: commits, branching, remotes and collaboration on GitHub.
   - Human verification date: `2026-11-22`

7. [x] **Learn web development** (`mdn-learn-web`)
   - URL: [https://developer.mozilla.org/en-US/docs/Learn_web_development](https://developer.mozilla.org/en-US/docs/Learn_web_development)
   - Learning objective: HTML, CSS, JavaScript, accessibility and web fundamentals in a structured path.
   - Human verification date: `2026-11-22`

8. [x] **The Odin Project** (`odin-project`)
   - URL: [https://www.theodinproject.com/](https://www.theodinproject.com/)
   - Learning objective: Project-based full-stack JavaScript or Ruby on Rails curriculum.
   - Human verification date: `2026-11-22`

9. [x] **Software Engineering at Google** (`swe-at-google`)
   - URL: [https://abseil.io/resources/swe-book](https://abseil.io/resources/swe-book)
   - Learning objective: How large teams keep code healthy: code review, testing, documentation, dependency management.
   - Human verification date: `2026-11-22`

10. [x] **Elements of AI** (`elements-of-ai`)
   - URL: [https://www.elementsofai.com/](https://www.elementsofai.com/)
   - Learning objective: What AI is, what it can and cannot do, and its effects on society. No math or code needed for Part 1.
   - Human verification date: `2026-11-22`

11. [x] **Ethics of AI** (`ethics-of-ai`)
   - URL: [https://ethics-of-ai.mooc.fi/](https://ethics-of-ai.mooc.fi/)
   - Learning objective: Accountability, transparency, fairness, human rights and AI ethics in practice.
   - Human verification date: `2026-11-22`

12. [x] **CS50's Introduction to Artificial Intelligence with Python** (`cs50-ai`)
   - URL: [https://cs50.harvard.edu/ai/](https://cs50.harvard.edu/ai/)
   - Learning objective: Search, optimization, machine learning, neural networks and language models through Python projects.
   - Human verification date: `2026-11-22`

13. [x] **Machine Learning Crash Course** (`google-ml-crash-course`)
   - URL: [https://developers.google.com/machine-learning/crash-course](https://developers.google.com/machine-learning/crash-course)
   - Learning objective: Regression, classification, data preparation, overfitting, neural networks, embeddings, fairness.
   - Human verification date: `2026-11-22`

14. [x] **Practical Deep Learning for Coders** (`fastai-practical-dl`)
   - URL: [https://course.fast.ai/](https://course.fast.ai/)
   - Learning objective: Train and deploy deep learning models for vision, text and tabular data with PyTorch.
   - Human verification date: `2026-11-22`

15. [x] **Hugging Face LLM Course** (`hf-llm-course`)
   - URL: [https://huggingface.co/learn/llm-course](https://huggingface.co/learn/llm-course)
   - Learning objective: Transformers, tokenizers, datasets and fine-tuning large language models.
   - Human verification date: `2026-11-22`

16. [x] **AI Risk Management Framework** (`nist-ai-rmf`)
   - URL: [https://www.nist.gov/itl/ai-risk-management-framework](https://www.nist.gov/itl/ai-risk-management-framework)
   - Learning objective: How organizations identify and manage risks when designing and using AI systems.
   - Human verification date: `2026-11-22`

17. [x] **Seeing Theory** (`seeing-theory`)
   - URL: [https://seeing-theory.brown.edu/](https://seeing-theory.brown.edu/)
   - Learning objective: Visual, interactive probability and statistics: distributions, inference, regression.
   - Human verification date: `2026-11-22`

18. [x] **OpenIntro Statistics** (`openintro-statistics`)
   - URL: [https://www.openintro.org/book/os/](https://www.openintro.org/book/os/)
   - Learning objective: Data summaries, probability, inference and regression, with videos, slides and labs.
   - Human verification date: `2026-11-22`

19. [x] **Linear Algebra (18.06)** (`mit-18-06-linear-algebra`)
   - URL: [https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/)
   - Learning objective: Vectors, matrices and linear systems: the math behind machine learning and robot motion.
   - Human verification date: `2026-11-22`

20. [x] **Data Analysis and Visualization in Python for Ecologists** (`data-carpentry-python-ecology`)
   - URL: [https://datacarpentry.github.io/python-ecology-lesson/](https://datacarpentry.github.io/python-ecology-lesson/)
   - Learning objective: Load, clean, combine and plot real ecological survey data with pandas.
   - Human verification date: `2026-11-22`

21. [x] **Getting Started with scikit-learn** (`scikit-learn-getting-started`)
   - URL: [https://scikit-learn.org/stable/getting_started.html](https://scikit-learn.org/stable/getting_started.html)
   - Learning objective: Fitting estimators, building pipelines, cross-validation and parameter tuning.
   - Human verification date: `2026-11-22`

22. [x] **CS50's Introduction to Cybersecurity** (`cs50-cybersecurity`)
   - URL: [https://cs50.harvard.edu/cybersecurity/](https://cs50.harvard.edu/cybersecurity/)
   - Learning objective: Securing accounts, data, systems and software; privacy; recognizing and weighing threats.
   - Human verification date: `2026-11-22`

23. [x] **Bandit Wargame** (`overthewire-bandit`)
   - URL: [https://overthewire.org/wargames/bandit/](https://overthewire.org/wargames/bandit/)
   - Learning objective: Command-line fundamentals through progressive puzzle levels.
   - Human verification date: `2026-11-22`

24. [x] **CyLab Security Academy (formerly picoCTF)** (`cylab-security-academy`)
   - URL: [https://cylabacademy.org/](https://cylabacademy.org/)
   - Learning objective: Capture-the-flag challenges and learning paths in cryptography, web security, forensics and more.
   - Human verification date: `2026-11-22`

25. [x] **OWASP Top 10** (`owasp-top-10`)
   - URL: [https://owasp.org/www-project-top-ten/](https://owasp.org/www-project-top-ten/)
   - Learning objective: The most critical web application security risks and how to prevent them.
   - Human verification date: `2026-11-22`

26. [x] **Cybersecurity Framework** (`nist-csf`)
   - URL: [https://www.nist.gov/cyberframework](https://www.nist.gov/cyberframework)
   - Learning objective: How organizations identify, protect, detect, respond to and recover from cyber risk (CSF 2.0).
   - Human verification date: `2026-11-22`

27. [x] **Lessons in Electric Circuits** (`all-about-circuits-textbook`)
   - URL: [https://www.allaboutcircuits.com/textbook/](https://www.allaboutcircuits.com/textbook/)
   - Learning objective: DC and AC circuits, semiconductors and digital logic, from first principles.
   - Human verification date: `2026-11-22`

28. [x] **Introduction to Robotics (2.12)** (`mit-2-12-intro-robotics`)
   - URL: [https://ocw.mit.edu/courses/2-12-introduction-to-robotics-fall-2005/](https://ocw.mit.edu/courses/2-12-introduction-to-robotics-fall-2005/)
   - Learning objective: Robot mechanisms, kinematics, dynamics, control, actuators and sensors.
   - Human verification date: `2026-11-22`

29. [x] **Modern Robotics: Mechanics, Planning, and Control** (`modern-robotics`)
   - URL: [https://hades.mech.northwestern.edu/index.php/Modern_Robotics](https://hades.mech.northwestern.edu/index.php/Modern_Robotics)
   - Learning objective: Configuration space, kinematics, dynamics, motion planning and control, with video lectures and code.
   - Human verification date: `2026-11-22`

30. [x] **Introducing the environment: Ecology and ecosystems** (`openlearn-ecology`)
   - URL: [https://www.open.edu/openlearn/nature-environment/environmental-studies/introducing-the-environment-ecology-and-ecosystems/content-section-0?active-tab=description-tab](https://www.open.edu/openlearn/nature-environment/environmental-studies/introducing-the-environment-ecology-and-ecosystems/content-section-0?active-tab=description-tab)
   - Learning objective: How ecosystems work and how scientists study human effects on them.
   - Human verification date: `2026-11-22`

31. [x] **iNaturalist** (`inaturalist`)
   - URL: [https://www.inaturalist.org/](https://www.inaturalist.org/)
   - Learning objective: Record wildlife observations and contribute to a shared biodiversity dataset.
   - Human verification date: `2026-11-22`

32. [x] **The GLOBE Program** (`globe-program`)
   - URL: [https://www.globe.gov/](https://www.globe.gov/)
   - Learning objective: Collect standardized environmental measurements (air, water, soil, land cover) for NASA science.
   - Human verification date: `2026-11-22`

33. [x] **NASA Earth Observatory** (`nasa-earth-observatory`)
   - URL: [https://science.nasa.gov/earth/earth-observatory](https://science.nasa.gov/earth/earth-observatory)
   - Learning objective: Satellite images and articles explaining changes in Earth's land, oceans and atmosphere.
   - Human verification date: `2026-11-22`
