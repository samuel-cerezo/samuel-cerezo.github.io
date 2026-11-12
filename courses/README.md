# Courses

The catalog at /courses/ shares css/index.scss and publication-card markup with the portfolio.
Add entries in _data/courses.yml for future courses.

The first course is served at /courses/primi-passi-digitali/. Its static assets and local lab are hosted here. Published lesson data and released PDFs are read from the existing course service; teacher sign-in and writes remain on that service. No private API keys, unpublished lessons or credentials belong here.

The catalog and teaching contents are an initial proposal pending the final syllabus.

The file lab works entirely locally after its JavaScript loads, including when the lesson service is unavailable. It simulates files only; it never accesses a learner's actual documents. Student progress stays in their browser. Local storage unavailable: the exercise still works for the current session.
