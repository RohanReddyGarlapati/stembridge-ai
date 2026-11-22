# STEMBridge AI — Release Catalog Research

Status: Research draft · Prepared 2026-11-19 · Input for TASKS T1.4 (catalog authoring) and T5.4 (resource verification gate)
References: [ARCHITECTURE.md §4](ARCHITECTURE.md#4-catalog-data-model) · [TASKS.md](TASKS.md) · [TEST_PLAN.md §2.1](TEST_PLAN.md#21-catalog-integrity-testsunitcatalogtestts-real-datajson)

`data/careers.json` and `data/resources.json` were **not** modified.

## 1. Summary

| Item | Proposal | Release rule |
|---|---|---|
| Careers | 6: AI Engineer, Data Scientist, Cybersecurity Analyst, Robotics Engineer, Software Engineer, Environmental Scientist | 6–8 ✅ |
| Resources | **33** active, all automatically checked (§3) | 25–35 ✅ |
| Steps | 5 or 6 per career, 1–2 resources per step | 4–6 steps, 1–3 resources ✅ |
| Orphan resources | 0: every resource is used by at least one step; 14 are shared across careers | ✅ |
| Interest tags | All 11 enum tags are used by at least one career | ✅ |
| `example.com` URLs | None | ✅ |

**What "verified" means here.** On 2026-11-19 I fetched each page with an automated tool and checked that it loaded normally (no error, no redirect to another site) and that its title, publisher and topics match the table. This is **not** the human verification that ARCHITECTURE §4.2 and PRD AC-6 require. A person must still open every URL, confirm it's suitable for teenagers, and only then set `verifiedAt` (TASKS T5.4). **Don't copy the 2026-11-19 check date into `verifiedAt` without that human review.**

## 2. Status legend

| Status | Meaning |
|---|---|
| **AUTO-VERIFIED** | Page content was fetched and loaded normally. Title, publisher, cost and topics were confirmed from the page itself. Still needs the human check above. |
| **PARTIAL** | Only the HTTP status or `<title>` could be read: the page needs JavaScript, has bot protection, or blocked automated access. Topics and suitability were **not** confirmed. |
| **REJECTED** | The URL is gone, moved, or redirects somewhere else. Don't use it. |

All 33 active catalog resources are **AUTO-VERIFIED**. Section 4 records partial results, rejected URLs, and later exclusions.

## 3. Proposed resources (33)

Columns map directly to the `Resource` schema (`id`, `title`, `provider`, `url`, `type`, `cost`, `level`). "Used in" lists `careerId/stepId`.

### 3.1 Programming and computer science

| id | title | provider | url | type | cost | level | Learning objective | Used in | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| `cs50x` | CS50's Introduction to Computer Science | Harvard University | https://cs50.harvard.edu/x/ | course | free | beginner | Computational thinking, algorithms, data structures, C, Python, SQL and web basics. | `software-engineer/se-foundations`, `cybersecurity-analyst/cy-programming` | Loaded. Free via OpenCourseWare; page says most students have no prior CS. Paid certificates are optional through edX. |
| `cs50-python` | CS50's Introduction to Programming with Python | Harvard University | https://cs50.harvard.edu/python/ | course | free | beginner | Python functions, loops, exceptions, libraries, **unit testing**, file I/O, regex and OOP. | `ai-engineer/ai-python`, `cybersecurity-analyst/cy-programming`, `robotics-engineer/rb-python`, `software-engineer/se-testing` | Loaded. "For students with or without prior programming experience." |
| `py4e` | Python for Everybody | University of Michigan | https://www.py4e.com/ | course | free | beginner | Python fundamentals through lessons, a free textbook and autograded exercises. | `ai-engineer/ai-python`, `data-scientist/ds-python`, `environmental-scientist/es-data` | Loaded. Free materials; paid Coursera/edX options exist. |
| `python-tutorial` | The Python Tutorial | Python Software Foundation | https://docs.python.org/3/tutorial/ | article | free | intermediate | The official tour of the language: control flow, data structures, modules, errors, classes, virtual environments. | `data-scientist/ds-python`, `software-engineer/se-testing` | Loaded (shows the Python 3.15 docs). Aimed at people who can already program a little, so marked intermediate. |
| `missing-semester` | The Missing Semester of Your CS Education | MIT CSAIL | https://missing.csail.mit.edu/ | course | free | intermediate | Command line, shell, Git, debugging, profiling and development environments. | `cybersecurity-analyst/cy-command-line`, `software-engineer/se-tools` | Loaded. CC BY-NC-SA. Assumes some CS background. |
| `pro-git` | Pro Git (2nd Edition) | Scott Chacon and Ben Straub (git-scm.com) | https://git-scm.com/book/en/v2 | book | free | beginner | Version control: commits, branching, remotes and collaboration on GitHub. | `data-scientist/ds-share`, `software-engineer/se-tools` | Loaded. Full book free online under CC BY-NC-SA 3.0. |
| `mdn-learn-web` | Learn web development | Mozilla (MDN) | https://developer.mozilla.org/en-US/docs/Learn_web_development | course | free | beginner | HTML, CSS, JavaScript, accessibility and web fundamentals in a structured path. | `software-engineer/se-web`, `cybersecurity-analyst/cy-web-risks` | Loaded. Beginner-to-intermediate curriculum. |
| `odin-project` | The Odin Project | The Odin Project | https://www.theodinproject.com/ | course | free | beginner | Project-based full-stack JavaScript or Ruby on Rails curriculum. | `software-engineer/se-web` | Loaded. "Our full stack curriculum is free." |
| `swe-at-google` | Software Engineering at Google | Titus Winters, Tom Manshreck and Hyrum Wright (O'Reilly) | https://abseil.io/resources/swe-book | book | free | intermediate | How large teams keep code healthy: code review, testing, documentation, dependency management. | `software-engineer/se-teams` | Loaded. Free HTML edition (CC BY-NC-ND 4.0). |

### 3.2 AI, data and mathematics

| id | title | provider | url | type | cost | level | Learning objective | Used in | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| `elements-of-ai` | Elements of AI | University of Helsinki and MinnaLearn | https://www.elementsofai.com/ | course | free | beginner | What AI is, what it can and cannot do, and its effects on society. No math or code needed for Part 1. | `ai-engineer/ai-concepts` | Loaded. Free. No age requirement shown. |
| `ethics-of-ai` | Ethics of AI | University of Helsinki | https://ethics-of-ai.mooc.fi/ | course | free | beginner | Accountability, transparency, fairness, human rights and AI ethics in practice. | `ai-engineer/ai-responsible` | Loaded. 7 chapters, self-paced. |
| `cs50-ai` | CS50's Introduction to Artificial Intelligence with Python | Harvard University | https://cs50.harvard.edu/ai/ | course | free | intermediate | Search, optimization, machine learning, neural networks and language models through Python projects. | `ai-engineer/ai-ml-basics`, `robotics-engineer/rb-intelligence` | Loaded. Prerequisite: CS50x or about a year of Python. |
| `google-ml-crash-course` | Machine Learning Crash Course | Google for Developers | https://developers.google.com/machine-learning/crash-course | course | free | intermediate | Regression, classification, data preparation, overfitting, neural networks, embeddings, fairness. | `ai-engineer/ai-ml-basics`, `data-scientist/ds-models` | Loaded. Free, modular. Marked intermediate because of the math and Python it assumes. |
| `fastai-practical-dl` | Practical Deep Learning for Coders | fast.ai | https://course.fast.ai/ | course | free | intermediate | Train and deploy deep learning models for vision, text and tabular data with PyTorch. | `ai-engineer/ai-deep-learning` | Loaded. Free course and book. Needs about a year of coding. |
| `hf-llm-course` | Hugging Face LLM Course | Hugging Face | https://huggingface.co/learn/llm-course | course | free | intermediate | Transformers, tokenizers, datasets and fine-tuning large language models. | `ai-engineer/ai-deep-learning` | Loaded (title "Introduction to the Hugging Face Course"). Free, no ads, Apache 2.0. Needs good Python. |
| `nist-ai-rmf` | AI Risk Management Framework | U.S. National Institute of Standards and Technology (NIST) | https://www.nist.gov/itl/ai-risk-management-framework | article | free | intermediate | How organizations identify and manage risks when designing and using AI systems. | `ai-engineer/ai-responsible` | Loaded. AI RMF 1.0, which the page says is being revised. Playbook linked. |
| `seeing-theory` | Seeing Theory | Brown University | https://seeing-theory.brown.edu/ | interactive | free | beginner | Visual, interactive probability and statistics: distributions, inference, regression. | `ai-engineer/ai-math`, `data-scientist/ds-statistics`, `environmental-scientist/es-statistics` | Loaded. 6 interactive chapters. The page calls itself archived but works. |
| `openintro-statistics` | OpenIntro Statistics | OpenIntro | https://www.openintro.org/book/os/ | book | free | intermediate | Data summaries, probability, inference and regression, with videos, slides and labs. | `data-scientist/ds-statistics`, `environmental-scientist/es-statistics` | Loaded. PDF free (pay-what-you-want, $0 allowed). College level. |
| `mit-18-06-linear-algebra` | Linear Algebra (18.06) | MIT OpenCourseWare | https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/ | course | free | intermediate | Vectors, matrices and linear systems: the math behind machine learning and robot motion. | `ai-engineer/ai-math`, `robotics-engineer/rb-math` | Loaded. Prof. Gilbert Strang; video lectures; CC BY-NC-SA 4.0. |
| `data-carpentry-python-ecology` | Data Analysis and Visualization in Python for Ecologists | Data Carpentry (The Carpentries) | https://datacarpentry.github.io/python-ecology-lesson/ | course | free | beginner | Load, clean, combine and plot real ecological survey data with pandas. | `data-scientist/ds-wrangling`, `environmental-scientist/es-data` | Loaded, no redirect. CC BY 4.0. "No programming experience" assumed. |
| `scikit-learn-getting-started` | Getting Started with scikit-learn | scikit-learn developers | https://scikit-learn.org/stable/getting_started.html | article | free | intermediate | Fitting estimators, building pipelines, cross-validation and parameter tuning. | `data-scientist/ds-models` | Loaded (scikit-learn 1.9.1 docs). Replaces the old tutorial URL, which now returns 404 (§4). |

### 3.3 Cybersecurity

| id | title | provider | url | type | cost | level | Learning objective | Used in | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| `cs50-cybersecurity` | CS50's Introduction to Cybersecurity | Harvard University | https://cs50.harvard.edu/cybersecurity/ | course | free | beginner | Securing accounts, data, systems and software; privacy; recognizing and weighing threats. | `cybersecurity-analyst/cy-foundations` | Loaded. "For technical and non-technical audiences alike." |
| `overthewire-bandit` | Bandit Wargame | OverTheWire | https://overthewire.org/wargames/bandit/ | interactive | free | beginner | Command-line fundamentals through progressive puzzle levels. | `cybersecurity-analyst/cy-command-line` | Loaded. Starts at Level 0 for absolute beginners. Requires SSH to OverTheWire's own servers. |
| `cylab-security-academy` | CyLab Security Academy (formerly picoCTF) | Carnegie Mellon University CyLab | https://cylabacademy.org/ | interactive | free | beginner | Capture-the-flag challenges and learning paths in cryptography, web security, forensics and more. | `cybersecurity-analyst/cy-practice` | Loaded. "Always free." Audience stated as middle school through adults. Needs an account. |
| `owasp-top-10` | OWASP Top 10 | OWASP Foundation | https://owasp.org/www-project-top-ten/ | article | free | intermediate | The most critical web application security risks and how to prevent them. | `cybersecurity-analyst/cy-web-risks`, `software-engineer/se-security` | Loaded. 2025 edition is the latest shown. |
| `nist-csf` | Cybersecurity Framework | U.S. National Institute of Standards and Technology (NIST) | https://www.nist.gov/cyberframework | article | free | intermediate | How organizations identify, protect, detect, respond to and recover from cyber risk (CSF 2.0). | `cybersecurity-analyst/cy-risk` | Loaded. CSF 2.0 with Quick Start Guides. |

### 3.4 Robotics and electronics

| id | title | provider | url | type | cost | level | Learning objective | Used in | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| `all-about-circuits-textbook` | Lessons in Electric Circuits | All About Circuits (Tony R. Kuphaldt) | https://www.allaboutcircuits.com/textbook/ | book | free | beginner | DC and AC circuits, semiconductors and digital logic, from first principles. | `robotics-engineer/rb-electronics` | Loaded. Free under the Design Science License. Page title is "Textbook for Electrical Engineering & Electronics". |
| `mit-2-12-intro-robotics` | Introduction to Robotics (2.12) | MIT OpenCourseWare | https://ocw.mit.edu/courses/2-12-introduction-to-robotics-fall-2005/ | course | free | intermediate | Robot mechanisms, kinematics, dynamics, control, actuators and sensors. | `robotics-engineer/rb-mechanics` | Loaded. Lecture notes, problem sets, projects. CC BY-NC-SA 4.0. Fall 2005 materials. |
| `modern-robotics` | Modern Robotics: Mechanics, Planning, and Control | Northwestern University (Kevin M. Lynch and Frank C. Park) | https://hades.mech.northwestern.edu/index.php/Modern_Robotics | book | free | intermediate | Configuration space, kinematics, dynamics, motion planning and control, with video lectures and code. | `robotics-engineer/rb-mechanics`, `robotics-engineer/rb-motion` | Loaded. Free preprint PDF and video lectures; printed book sold separately. Needs physics, calculus and linear algebra. |

### 3.5 Environmental science

| id | title | provider | url | type | cost | level | Learning objective | Used in | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| `openlearn-ecology` | Introducing the environment: Ecology and ecosystems | The Open University (OpenLearn) | https://www.open.edu/openlearn/nature-environment/environmental-studies/introducing-the-environment-ecology-and-ecosystems/content-section-0 | course | free | beginner | How ecosystems work and how scientists study human effects on them. | `environmental-scientist/es-ecology` | Loaded, no redirect. Level 1, about 5 hours. Can be started without signing up. |
| `inaturalist` | iNaturalist | iNaturalist (nonprofit) | https://www.inaturalist.org/ | interactive | free | beginner | Record wildlife observations and contribute to a shared biodiversity dataset. | `environmental-scientist/es-field-data` | Loaded. Posting needs an account. Site points under-13 users to its companion app Seek (see §6). |
| `globe-program` | The GLOBE Program | GLOBE (NASA-sponsored) | https://www.globe.gov/ | interactive | free | beginner | Collect standardized environmental measurements (air, water, soil, land cover) for NASA science. | `environmental-scientist/es-field-data` | Loaded. Serves students, educators and citizen scientists. |
| `nasa-earth-observatory` | NASA Earth Observatory | NASA Science | https://science.nasa.gov/earth/earth-observatory | article | free | beginner | Satellite images and articles explaining changes in Earth's land, oceans and atmosphere. | `environmental-scientist/es-remote-sensing` | Loaded. The old `earthobservatory.nasa.gov` domain redirects here with a 301 (§4). |

## 4. Candidates not in the proposed catalog

### 4.1 Auto-verified alternates (usable as swaps)
| Candidate | URL | Note |
|---|---|---|
| MIT 6.0001 Intro to CS and Programming in Python | https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/ | Loaded. Overlaps with `py4e` and `cs50-python`. |
| Software Carpentry: Programming with Python | https://swcarpentry.github.io/python-novice-inflammation/ | Loaded. CC BY 4.0. Overlaps with `data-carpentry-python-ecology`. |
| pytest: Get Started | https://docs.pytest.org/en/stable/getting-started.html | Loaded. A good extra for `se-testing` if a slot frees up. |
| CISA Cybersecurity Training & Exercises | https://www.cisa.gov/cybersecurity-training-exercises | Loaded. A hub of free CISA courses rather than one resource. |

### 4.2 Needs manual checking (PARTIAL)
| Candidate | URL | What happened |
|---|---|---|
| Khan Academy: Statistics and probability, Linear algebra, Ecology, Electrical engineering, Computers and the Internet | e.g. https://www.khanacademy.org/math/statistics-probability | HTTP 200 but only a "Client Challenge" bot check; content couldn't be read. Strong candidates for younger students. **Verify manually.** |
| ROS 2 Jazzy Tutorials | https://docs.ros.org/en/jazzy/Tutorials.html | Blocked by a bot check ("Making sure you're not a bot!"). Highly relevant to robotics. **Verify manually** and consider swapping it into `rb-motion`. |
| Arduino: Getting Started with Arduino | https://docs.arduino.cc/learn/starting-guide/getting-started-arduino/ | HTTP 200, but the page needs JavaScript and returned no readable content. **Verify manually.** It's a hands-on option for `rb-electronics`. |
| Kaggle Learn: Pandas, Intro to Machine Learning, Data Visualization | https://www.kaggle.com/learn/pandas etc. | Only the titles could be read; lessons and requirements weren't visible. Exercises need a Kaggle account. **Check the account age terms manually.** |
| Teachable Machine | https://teachablemachine.withgoogle.com/ | Title only. |
| freeCodeCamp curriculum | https://www.freecodecamp.org/learn | HTTP 200 (redirects to drop the trailing slash); no readable content. |
| Cisco Networking Academy: Introduction to Cybersecurity | https://www.netacad.com/courses/introduction-to-cybersecurity | Title only ("Free Online Course"). Account and age requirements not confirmed. |
| NOAA Climate.gov: Teaching Climate | https://www.climate.gov/teaching | `curl` got 200 and the title, but the fetch tool got 403. Content not confirmed. |
| SparkFun: What is Electricity? | https://learn.sparkfun.com/tutorials/what-is-electricity | 403 for automated access. |
| OpenStax Biology 2e | https://openstax.org/details/books/biology-2e | Title only. |
| Introduction to Environmental Sciences and Sustainability (Open Textbook Library) | https://open.umn.edu/opentextbooks/textbooks/introduction-to-environmental-sciences-and-sustainability | Loaded, but the page said it was "only viewing locally cached content". Recheck before use. |

### 4.3 Rejected
| Candidate | URL | Reason |
|---|---|---|
| picoCTF | https://picoctf.org/ | Rebranded. The page says "picoCTF.org is now CyLab Security Academy" (existing logins honoured from before May 8, 2026). Replaced by `cylab-security-academy`. |
| scikit-learn tutorial index | https://scikit-learn.org/stable/tutorial/index.html | First fetch 503, second **404**. Replaced by `scikit-learn-getting-started`. |
| 3Blue1Brown neural-networks topic page | https://www.3blue1brown.com/topics/neural-networks | Redirects to the homepage (`/?topic=neural-networks`). There is no stable topic page to link to. |
| NASA ARSET (old URL) | https://appliedsciences.nasa.gov/get-involved/training/english/arset-fundamentals-remote-sensing | 301 to the Earthdata ARSET hub. See the later exclusion in §4.4. |
| NASA Earth Observatory (old domain) | https://earthobservatory.nasa.gov/ | 301 to `science.nasa.gov`. Use the new URL. |

### 4.4 Excluded after research

NASA Earthdata (ARSET) **Fundamentals of Remote Sensing** (`nasa-arset-remote-sensing`) was among the 34 original proposals. The 2026-11-19 automated pass reached the [training landing page](https://www.earthdata.nasa.gov/learn/trainings/fundamentals-remote-sensing), which described a two-hour self-paced introduction to how satellites measure Earth and the limits of their data. On 2026-11-22, the course was excluded because lessons require registration and authenticated lesson access was not verified. See the [human review tracker](HUMAN_REVIEW_TRACKER.md).

## 5. Proposed careers and roadmaps

All step descriptions are under 60 words and 600 characters. Step IDs are kebab-case and unique within each career. Durations are rough estimates for a high-school learner studying part time.

### 5.1 `ai-engineer`: AI Engineer
- **field:** `technology` · **tags:** `coding`, `data-math`, `robots`
- **summary:** Designs, trains and deploys machine learning systems that learn from data, and makes sure they are safe and fair.
- **keySkills:** Python programming, Machine learning, Mathematics for AI, Responsible AI

| # | step id | title | description | skills | duration | resourceIds |
|---|---|---|---|---|---|---|
| 1 | `ai-python` | Learn to program in Python | Python is the main language of AI. Practise variables, loops, functions and debugging by solving many small problems. | Python, Problem solving | 6–10 weeks | `cs50-python`, `py4e` |
| 2 | `ai-concepts` | Understand what AI can and cannot do | Learn the core ideas behind AI, where it works well, where it fails, and how it affects people, before writing AI code. | AI concepts, Critical thinking | 2–4 weeks | `elements-of-ai` |
| 3 | `ai-math` | Build the math foundations | Machine learning relies on probability, statistics and linear algebra. Use visual tools first, then work through matrix and vector problems. | Probability, Statistics, Linear algebra | 6–8 weeks | `seeing-theory`, `mit-18-06-linear-algebra` |
| 4 | `ai-ml-basics` | Train your first machine learning models | Learn how models learn from data, how to measure their accuracy, and how to avoid overfitting, using guided Python projects. | Machine learning, Model evaluation | 4–6 weeks | `google-ml-crash-course`, `cs50-ai` |
| 5 | `ai-deep-learning` | Explore deep learning and language models | Train neural networks for images and text, then learn how modern language models are built, fine-tuned and shared. | Deep learning, Neural networks, Language models | 6–10 weeks | `fastai-practical-dl`, `hf-llm-course` |
| 6 | `ai-responsible` | Design AI responsibly | Study fairness, transparency and accountability, and how organizations assess and reduce the risks of AI systems. | AI ethics, Risk management | 2–3 weeks | `ethics-of-ai`, `nist-ai-rmf` |

### 5.2 `data-scientist`: Data Scientist
- **field:** `technology` · **tags:** `data-math`, `coding`, `health`, `biology`
- **summary:** Collects, cleans and analyzes data to answer questions and make predictions in fields from health to the environment.
- **keySkills:** Statistics, Python and pandas, Data visualization, Machine learning

| # | step id | title | description | skills | duration | resourceIds |
|---|---|---|---|---|---|---|
| 1 | `ds-python` | Learn Python for working with data | Learn Python basics, including lists, dictionaries, files and functions, so you can load and process data on your own. | Python, Problem solving | 6–8 weeks | `py4e`, `python-tutorial` |
| 2 | `ds-statistics` | Learn statistics and probability | Understand distributions, sampling, inference and regression, the tools for deciding what data really shows. | Probability, Statistics, Regression | 6–8 weeks | `seeing-theory`, `openintro-statistics` |
| 3 | `ds-wrangling` | Clean, analyze and visualize data | Use pandas to load real survey data, fix messy values, combine tables and make clear charts. | pandas, Data cleaning, Data visualization | 3–4 weeks | `data-carpentry-python-ecology` |
| 4 | `ds-models` | Build predictive models | Train and evaluate models with scikit-learn, compare them with cross-validation, and avoid data leakage. | Machine learning, Model evaluation | 4–6 weeks | `scikit-learn-getting-started`, `google-ml-crash-course` |
| 5 | `ds-share` | Track and share your work | Use Git to save versions of your analysis, collaborate with others and publish projects for a portfolio. | Version control, Collaboration | 1–2 weeks | `pro-git` |

### 5.3 `cybersecurity-analyst`: Cybersecurity Analyst
- **field:** `technology` · **tags:** `security`, `coding`, `electronics`
- **summary:** Protects people and organizations by finding weaknesses, monitoring for attacks and responding to security incidents.
- **keySkills:** Security fundamentals, Command line, Web security, Risk management

| # | step id | title | description | skills | duration | resourceIds |
|---|---|---|---|---|---|---|
| 1 | `cy-foundations` | Learn security fundamentals | Learn how accounts, data, systems and software are attacked and defended, and how to weigh risks and trade-offs. | Security concepts, Threat awareness | 4–6 weeks | `cs50-cybersecurity` |
| 2 | `cy-command-line` | Get comfortable with the command line | Analysts work in terminals every day. Practise navigating files, searching text and using shell tools through guided levels. | Linux command line, Shell tools | 3–4 weeks | `overthewire-bandit`, `missing-semester` |
| 3 | `cy-programming` | Learn programming and how computers work | Understanding code and how the web works helps you spot vulnerabilities and automate security tasks. | Programming, Computer systems | 8–12 weeks | `cs50x`, `cs50-python` |
| 4 | `cy-practice` | Practise with capture-the-flag challenges | Solve beginner challenges in cryptography, forensics and web security, then follow guided learning paths. | Cryptography, Forensics, Problem solving | Ongoing | `cylab-security-academy` |
| 5 | `cy-web-risks` | Understand web application risks | Learn how websites are built, then study the most common web vulnerabilities and how developers prevent them. | Web security, HTML and JavaScript | 3–4 weeks | `owasp-top-10`, `mdn-learn-web` |
| 6 | `cy-risk` | Learn how organizations manage cyber risk | Explore how organizations identify, protect, detect, respond to and recover from security incidents. | Risk management, Security frameworks | 1–2 weeks | `nist-csf` |

### 5.4 `robotics-engineer`: Robotics Engineer
- **field:** `engineering` · **tags:** `robots`, `electronics`, `building`, `coding`, `space`
- **summary:** Designs, builds and programs robots that sense their surroundings and move, from factory arms to planetary rovers.
- **keySkills:** Programming, Electronics, Mechanics and kinematics, Control systems

| # | step id | title | description | skills | duration | resourceIds |
|---|---|---|---|---|---|---|
| 1 | `rb-python` | Learn to program in Python | Robots run on software. Learn Python basics, testing and debugging, which you will use to control and simulate robots. | Python, Debugging | 6–10 weeks | `cs50-python` |
| 2 | `rb-electronics` | Understand circuits and electronics | Learn voltage, current and resistance, then semiconductors and digital logic, the building blocks of sensors and motor controllers. | Circuits, Electronics, Digital logic | 4–6 weeks | `all-about-circuits-textbook` |
| 3 | `rb-math` | Learn the math of motion | Vectors and matrices describe where a robot is and how it moves. Build these linear algebra skills step by step. | Linear algebra, Vectors | 6–8 weeks | `mit-18-06-linear-algebra` |
| 4 | `rb-mechanics` | Study robot mechanisms and control | Learn how robot arms and wheels are designed, how kinematics and dynamics work, and how controllers keep motion accurate. | Kinematics, Dynamics, Control | 8–12 weeks | `mit-2-12-intro-robotics`, `modern-robotics` |
| 5 | `rb-motion` | Plan robot motion | Learn how robots plan collision-free paths and move wheeled bases and manipulators, using free video lectures and code. | Motion planning, Mobile robots | 4–6 weeks | `modern-robotics` |
| 6 | `rb-intelligence` | Add intelligence with AI | Use search, optimization and machine learning so robots can make decisions and recognize what they sense. | Search algorithms, Machine learning | 6–8 weeks | `cs50-ai` |

### 5.5 `software-engineer`: Software Engineer
- **field:** `technology` · **tags:** `coding`, `design`, `building`
- **summary:** Designs, builds, tests and maintains the apps, websites and systems that people use every day.
- **keySkills:** Programming, Web development, Version control, Testing

| # | step id | title | description | skills | duration | resourceIds |
|---|---|---|---|---|---|---|
| 1 | `se-foundations` | Learn computer science fundamentals | Learn how programs, algorithms and data structures work while writing code in several languages. | Algorithms, Data structures, Programming | 10–12 weeks | `cs50x` |
| 2 | `se-web` | Build websites with HTML, CSS and JavaScript | Create real web pages and apps, from layout and styling to interactivity and accessibility, through guided projects. | HTML and CSS, JavaScript, Accessibility | 8–12 weeks | `mdn-learn-web`, `odin-project` |
| 3 | `se-tools` | Master your developer tools | Use the command line, editors, debuggers and Git confidently so you can work efficiently and collaborate. | Git, Command line, Debugging | 3–4 weeks | `missing-semester`, `pro-git` |
| 4 | `se-testing` | Write tested, reliable code | Write unit tests, handle errors and organize code into modules so your programs keep working as they grow. | Unit testing, Error handling | 3–4 weeks | `cs50-python`, `python-tutorial` |
| 5 | `se-security` | Build secure software | Learn the most common security mistakes in web applications and how to design code that avoids them. | Secure coding, Web security | 2–3 weeks | `owasp-top-10` |
| 6 | `se-teams` | Learn how teams build software at scale | Explore code review, testing culture, documentation and dependency management used by large engineering teams. | Code review, Teamwork | 3–4 weeks | `swe-at-google` |

### 5.6 `environmental-scientist`: Environmental Scientist
- **field:** `science` · **tags:** `environment`, `biology`, `space`, `data-math`, `health`
- **summary:** Studies air, water, land and living things to understand environmental change and protect ecosystems and human health.
- **keySkills:** Ecology, Field observation, Data analysis, Remote sensing

| # | step id | title | description | skills | duration | resourceIds |
|---|---|---|---|---|---|---|
| 1 | `es-ecology` | Learn how ecosystems work | Study how living things interact with each other and their environment, and how human activity changes ecosystems. | Ecology, Scientific vocabulary | 1–2 weeks | `openlearn-ecology` |
| 2 | `es-field-data` | Observe nature and collect field data | Record plants, animals and environmental measurements using shared scientific protocols, and contribute to real research datasets. | Field observation, Data collection | Ongoing | `inaturalist`, `globe-program` |
| 3 | `es-statistics` | Learn statistics for science | Learn to summarize measurements, compare groups and test whether a pattern in your data is meaningful. | Statistics, Probability | 6–8 weeks | `seeing-theory`, `openintro-statistics` |
| 4 | `es-data` | Analyze environmental data with Python | Use Python and pandas to clean, combine and plot real ecological survey data. | Python, Data analysis, Data visualization | 4–6 weeks | `data-carpentry-python-ecology`, `py4e` |
| 5 | `es-remote-sensing` | See Earth from space with satellite data | Learn how satellites measure land, oceans and air, and explore images that show environmental change over time. | Remote sensing, Satellite imagery | 2–3 weeks | `nasa-earth-observatory` |

## 6. Schema and release-rule compliance check

Checked by hand against `lib/schemas.ts`, `lib/catalogSchemas.ts` and `lib/catalogLoader.ts`. These checks are not authoritative; the integrity tests are the final word once the data is written.

| Rule | Status |
|---|---|
| IDs kebab-case, ≤ 80 chars, unique per scope | ✅ Longest resource ID is `data-carpentry-python-ecology` (29). |
| Titles ≤ 160, providers ≤ 120, summaries ≤ 300 | ✅ Longest provider is "U.S. National Institute of Standards and Technology (NIST)" (58). |
| Descriptions ≤ 60 words and ≤ 600 chars | ✅ Longest is about 25 words. |
| `skills` 1–4 per step, `keySkills` 3–5 (each ≤ 80 chars) | ✅ |
| `tags` 2–5 per career, unique, from the enum; all 11 tags used | ✅ `robots`, `coding`, `space`, `biology`, `environment`, `building`, `health`, `data-math`, `electronics`, `security`, `design` |
| 4–6 steps per career, 1–3 unique resources per step | ✅ 5 or 6 steps, 1–2 resources |
| Every `resourceId` resolves; no orphans | ✅ All 33 used |
| URLs absolute HTTPS, no credentials, no local or IP hosts, no `utm_*`, unique ignoring fragments | ✅ |
| No `example.com` | ✅ |
| `type`, `cost`, `level` enums | ✅ |
| `verifiedAt` valid ISO date, not in the future, **human-checked within 14 days of release** | ✅ All 33 human verification dates recorded as 2026-11-22. Recheck freshness against the release date. |

## 7. Open issues for the developer

1. **Human review completed on 2026-11-22.** See the [verification checklist](RESOURCE_VERIFICATION_CHECKLIST.md). Run `npm run check-links` against the production catalog and resolve eligible inconclusive results using the [test plan](TEST_PLAN.md#manual-resolution-of-inconclusive-link-checks).
2. **Accounts and minors.** These resources need or encourage accounts:
   - `cylab-security-academy` (account required; site says middle school through adults).
   - `inaturalist` (account to post; the site points under-13 users to Seek).
   - `openlearn-ecology` (optional account).
   - `globe-program` (student data entry usually goes through a teacher).

   None of them collects data through STEMBridge, but consider a short "some resources ask you to create an account; ask a parent or teacher first" note in the UI copy.
3. **Intermediate resources.** 15 of 33 resources are intermediate (college level), mostly in the AI, robotics and math steps. The beginner steps come first in every roadmap, but if younger students struggle, the Khan Academy pages in §4.2 are the best beginner substitutes once manually checked.
4. **Documentation alignment.** ARCHITECTURE §4.1 still lists the old initial career set (it includes biomedical engineer and mechanical/aerospace as optional). Update it to these six careers when the catalog is written. With no `health`-field career, the fallback "diverse default set (three different fields)" will use technology, engineering and science, which still satisfies the rule.
5. **Tag fit.** `health` maps only to `data-scientist` and `environmental-scientist`, and `space` maps to `robotics-engineer` and `environmental-scientist`. Check that these matches feel reasonable when the keyword map is built (T2.1).
6. **Old course materials.** MIT 2.12 dates from 2005, and NIST AI RMF 1.0 is under revision. Both are still authoritative, but check them again at each release.
7. **Possible swaps.** ROS 2 tutorials (`rb-motion`) and Arduino (`rb-electronics`) would make the robotics path more hands-on. Each swap needs manual verification and must keep the total at 35 or fewer.
