
25. Improve CI/CD

Current state:

Firebase Hosting automatically deploys
Cloud Functions deployed manually

Future desired pipeline:

Pull Request
    ↓
Tests
    ↓
Build
    ↓
Firebase Preview Deployment

Merge to master
    ↓
Tests
    ↓
Build
    ↓
Firebase Hosting Deployment
    ↓
Cloud Functions Deployment

Before implementing automatic Function deployment:

Confirm secrets are configured correctly.
Confirm production function deployment is safe.
Ensure failures stop the deployment.
Do not deploy Functions from pull-request preview workflows unless intentionally designed.
26. Accessibility

Audit the entire application.

Check:

Semantic HTML
Keyboard navigation
Focus states
Heading hierarchy
Alt text
Form labels
Screen reader compatibility
Color contrast
Reduced-motion preference

Do not sacrifice accessibility for visual effects.

27. Responsive Design

Test at minimum:

320px
375px
390px
768px
1024px
1440px+

Critical pages:

Home
Experience
Projects
Resume
Contact

Mobile should not feel like an afterthought.

28. Performance

Evaluate:

Bundle size
Image optimization
Lazy loading
Route-level loading
Font loading
Large media
Animation performance
Lighthouse scores

Use lazy loading for large project/game content where appropriate.

Do not add unnecessary third-party dependencies.
