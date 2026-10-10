# NeuroCanvas — Visual Neural Network Playground

> **An interactive, visual neural network builder and mathematical simulator.**  
> Learn and experiment with deep learning from first principles: real numerical tensor values, transparent forward propagation, step-by-step calculus backpropagation, interactive concept cards, and breathable layer architectures.

---

## 🌟 Overview

**NeuroCanvas** bridges the gap between abstract mathematical formulas and intuitive graphical understanding. Unlike conventional machine learning libraries that conceal inner states behind opaque black-box abstractions, NeuroCanvas visualizes every intermediate variable:

- **Scalar & Tensor Products**: Watch synaptic weights $w_i \cdot x_i$ and additive biases $b$ sum into the pre-activation logit $z$.
- **Activation Functions**: Experience non-linear transformations (Sigmoid, ReLU, Leaky ReLU, Tanh, GELU, Softplus, ELU, Linear) plotted live with analytical derivatives $f'(z)$.
- **Step-by-Step Backpropagation**: Walk backward through the computational graph using the multivariate chain rule:
  $$\frac{\partial L}{\partial w_i} = \frac{\partial L}{\partial \hat{y}} \cdot \frac{\partial \hat{y}}{\partial z} \cdot \frac{\partial z}{\partial w_i} = \delta \cdot x_i$$
- **Breathable Layer Frames**: Organize complex networks into named layers (Input, Dense Hidden, Latent, Output) with draggable headers and direct node slider controls.
- **Client-Side Mathematical Engine**: Runs entirely within the browser. 100% private, ultra-responsive, zero server dependency.

---

## 🚀 Key Features

### 1. Interactive Node Graph Canvas
- **Input Nodes**: Interactive scalar and 2D vector coordinates with fast popover sliders.
- **Neuron Nodes**: Dynamic bias controls, activation function selectors, live pre-activation $z$ readout, post-activation output $a$, and downstream error gradient $\delta$.
- **Output Nodes**: Target ground truth sliders, live loss computation (Mean Squared Error, Binary Cross-Entropy), and backward error injection.
- **Weighted Synaptic Edges**: Animated forward signal pulses and gradient flow indicators with weight sliders.

### 2. Breathable Layer Management
- Group nodes into logical layers (Input Layer, Hidden Layer 1, Latent Bottleneck, Output Layer).
- Layer bounding frames with generous padding, individual layer color tagging, and draggable layer badges.
- **Full Node Interactivity**: Move whole layers together or interact directly with contained neuron sliders, dropdowns, and target inputs without interference.

### 3. Presets & Architecture Zoo
Rich library of pre-built neural network topologies categorized by difficulty:
- **Beginner**: Single Perceptron, Linear Regression, NOT Inverter.
- **Easy**: Logical AND Perceptron, Logical OR Gate.
- **Intermediate**: The classic XOR Problem (2-2-1 network proving linear separability limitations), Softmax 3-Way Classifier.
- **Advanced**: Autoencoder with Latent Compression, Deep 3-4-2 Feedforward Network, LeNet-Style Feature Extractor, Deep Residual Skip-Connection Network.

### 4. Interactive Concept Cards
Twelve dedicated concept exploration nodes for learners:
1. **Activation Plot**: Real-time function curves and derivative calculus.
2. **Decision Boundary**: 2D hyperplane classification visualizer (AND / OR / XOR).
3. **Loss Landscape & Descent**: 3D contour optimization trajectories with momentum.
4. **Gradient Flow**: Vanishing and exploding gradient detection across multi-layer depth.
5. **Regularization & Dropout**: L1 Lasso sparsity, L2 Ridge weight decay, and stochastic dropout masks.
6. **Softmax & Temperature**: Logits probability distribution and entropy sharpening.
7. **Loss Comparison**: Mean Squared Error (MSE) vs. Cross-Entropy loss penalization.
8. **Confusion Matrix**: Precision, Recall, F1-Score, and accuracy heatmaps.
9. **Learning Rate Dynamics**: Divergence, oscillation, and optimal convergence comparisons.
10. **Overfitting & Early Stopping**: Generalization gap between training and validation loss.

### 5. Guided Curriculum & Lessons
Nine progressive interactive lessons that guide users from biological neurons to deep backpropagation networks with auto-grading challenges, real-time hint systems, and IndexedDB local progress persistence.

### 6. Desktop PWA (Progressive Web App)
- Purpose-built for desktop installation (**Desktop ONLY**).
- Offline-ready with cached application shell and IndexedDB local storage (`Dexie.js`).
- Window controls overlay and native desktop window framing.

### 7. Instant Sharing & Export
- **Compressed URL State**: Share interactive network models instantly using compact LZ-String encoded hashes.
- **High-Resolution PNG**: Export production-ready SVG/PNG diagrams for research papers and presentations.
- **JSON Topology**: Export and import complete architecture definitions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 15 (App Router), React 19, TypeScript |
| **Canvas & Graph** | `@xyflow/react` (React Flow 12) |
| **Styling & UI** | Tailwind CSS v4, Lucide React icons |
| **Mathematical Typesetting** | KaTeX (`katex`) |
| **State Management** | Zustand (Canvas store, Simulation store, UI store, Lesson store) |
| **Persistence & Storage** | IndexedDB via `Dexie.js` |
| **Compression** | `lz-string` |
| **Exporting** | `html-to-image`, `canvas-confetti` |

---

## 📦 Project Structure

```text
├── app/
│   ├── globals.css              # Global styles, Tailwind v4 imports, KaTeX styling
│   ├── layout.tsx               # Root layout, PWA meta tags, favicon & icon references
│   ├── manifest.ts              # Web App Manifest for Desktop PWA installation
│   └── page.tsx                 # Route coordinator (Landing, Learn Curriculum, Studio Canvas)
├── components/
│   ├── canvas/                  # React Flow canvas, LayerFrames, SimulationBar, Minimap
│   │   ├── concepts/            # Interactive concept cards (GradientFlow, Softmax, etc.)
│   │   └── nodes/               # Custom nodes (NeuronNode, InputNode, OutputNode)
│   ├── layout/                  # TopBar, Navigation, Theme switcher
│   ├── sidebars/                # LeftSidebar (Palette, Presets, Concepts) & RightSidebar (Inspector)
│   ├── ui/                      # Modals, AppLogo, PWAInstallButton, ToastContainer
│   └── views/                   # LandingView, LessonListView, PlayView
├── lib/
│   ├── content/                 # Guided lessons & architecture templates
│   ├── engine/                  # Forward propagation, analytical backpropagation, loss functions
│   ├── persistence/             # IndexedDB database, schema migrations, URL hash sharing
│   └── state/                   # Zustand stores (canvasStore, simStore, uiStore, lessonStore)
├── public/
│   ├── favicon.svg              # Official browser favicon
│   ├── icon.svg                 # Application icon
│   └── logo.svg                 # Unaltered official application SVG logo
├── LICENCE.md                   # Software license terms
└── README.md                    # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.18.0 or higher
- **Package Manager**: npm, pnpm, yarn, or bun

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/neurocanvas.git
cd neurocanvas
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 📜 Open Source License & Terms of Use

NeuroCanvas is released under a **Custom Open Source License** designed for open collaboration, personal education, research, self-hosting, and internal business use:

### What You CAN Do:
✅ **Free to Use**: Use the application for personal, academic, scientific, or commercial learning without charge.  
✅ **Free to Self-Host**: Host and deploy your own instance of the application for yourself, your school, university, or company.  
✅ **Free Internal Commercial Use**: Use the platform within your organization, company training programs, or internal engineering workflows.  
✅ **Contribute & Fork**: Fork the project, submit improvements, fix bugs, and create new educational lessons.

### What You CANNOT Do:
❌ **Reselling Prohibited**: You **cannot** resell, sublicense, rent, or lease this codebase or any derivative work as your own commercial product.  
❌ **Proprietary Rebranding & Code Distribution**: You **cannot** take this repository, rebrand it, and distribute or sell it as your own commercial software.

### 💼 Commercial Licensing & White-Label Inquiries
If your company, organization, or educational institution wishes to:
- Purchase a proprietary commercial license,
- Rebrand / white-label the software for public resale or paid distribution,
- Integrate NeuroCanvas into a proprietary commercial offering or enterprise LMS,

Please contact the creator directly to acquire an official commercial license agreement:
- **Creator**: Cedric Kasera
- **Email**: [omarkasera50@gmail.com](mailto:omarkasera50@gmail.com)
- **Phone**: [+254757835421](tel:+254757835421)

For the full legal terms, refer to [LICENCE.md](./LICENCE.md).

---

## 🤝 Contributing Guidelines

We welcome community contributions, bug fixes, performance optimizations, and new educational concept cards! To ensure smooth collaboration, please adhere to the following workflow:

### 1. Branching Strategy
- Always create your contribution in a **new feature or bugfix branch**:
  ```bash
  git checkout -b feature/your-feature-name
  # or
  git checkout -b fix/issue-description
  ```
- **Never commit directly to the `main` branch.**

### 2. Contribution Steps
1. **Fork** the repository to your own GitHub account.
2. **Clone** your fork locally and create a dedicated branch.
3. Make clean, atomic commits with informative commit messages:
   ```bash
   git commit -m "feat(concepts): add convolution filter kernel explorer card"
   ```
4. Run the linter and verify the build passes without errors:
   ```bash
   npm run lint
   npm run build
   ```
5. Push your branch to your fork and submit a **Pull Request (PR)** against the `main` branch.
6. Provide a clear description in your Pull Request explaining the problem solved or the feature introduced.

### 3. Reporting Issues & Feature Requests
- **Bug Reports**: Open an issue detailing the steps to reproduce, browser version, and expected vs. actual behavior.
- **Feature Requests**: Open an issue describing the proposed functionality, educational benefit, and architecture suggestions.

---

## 📬 Contact & Support

If you have questions, feedback, partnership proposals, or would like to discuss commercial licensing, feel free to get in touch:

- **Creator & Maintainer**: **Cedric Kasera**
- **Email**: [omarkasera50@gmail.com](mailto:omarkasera50@gmail.com)
- **Phone**: [+254757835421](tel:+254757835421)

---

*Crafted with precision for deep learning researchers, students, and engineers worldwide.*
