# LLM Calculator

Hardware recommendation tool for running Large Language Models. Get detailed hardware recommendations (Minimum, Ideal, Best) for any LLM deployment scenario.

## 🚀 Quick Start

### Prerequisites
- **Python 3.13+** with `uv` package manager ([Install uv](https://docs.astral.sh/uv/getting-started/installation/))
- **Node.js 22.1+** and npm

### Installation & Running

**1. Clone and navigate to the project:**
```bash
cd llmcalculator
```

**2. Start the Backend (Terminal 1):**
```bash
cd backend
uv sync          # Install Python dependencies
uv run python run_server.py
```
✅ Backend runs at: **http://localhost:8000**

**3. Start the Frontend (Terminal 2):**
```bash
cd frontend
npm install      # Install Node dependencies (first time only)
npm run dev
```
✅ Frontend runs at: **http://localhost:5173**

**4. Open your browser:**
Navigate to **http://localhost:5173**

## 📖 How to Use

### Basic Workflow

1. **Configure Your Scenario**
   - Enter model name (e.g., `llama-3.3-70b`, `qwen-2.5-7b`)
   - Set number of instances to run
   - Choose context window size (2K to 128K tokens)
   - Select use case (general, coding, reasoning, etc.)

2. **Add Multiple Models (Optional)**
   - Click "Add Another Model" for multi-model scenarios
   - Example: Run 10x Qwen 7B models simultaneously

3. **Choose Deployment Mode**
   - **Concurrent**: All models run in parallel (requires most resources)
   - **Sequential**: Models run one at a time in a queue
   - **Batched**: Models share resources efficiently

4. **Get Recommendations**
   - Click "Calculate Hardware"
   - View three tiers of recommendations:
     - 🟡 **Minimum**: Budget option, basic requirements met
     - 🟢 **Ideal**: Balanced performance and cost
     - 🔵 **Best**: Maximum performance configuration

### Example Scenarios

**Single Large Model:**
- Model: `llama-3.3-70b`
- Instances: 1
- Context: 4K tokens
- Result: GPU recommendations from single RTX 4090 to multi-GPU setups

**Multi-Model Swarm:**
- Model: `qwen-2.5-7b`
- Instances: 10
- Context: 8K tokens
- Deployment: Concurrent
- Result: Scaled GPU configurations for parallel execution

**Budget Setup:**
- Model: `mistral-7b`
- Instances: 1
- Context: 2K tokens
- Result: Consumer-grade GPU options and CPU fallbacks

## 🏗️ Project Structure

```
llmcalculator/
├── backend/              # FastAPI Python backend
│   ├── api/             # API routes
│   ├── core/            # Business logic (calculator, memory, speed estimation)
│   ├── models/          # Pydantic schemas
│   ├── utils/           # Data loading and utilities
│   └── main.py          # FastAPI app entry point
│
├── frontend/            # React TypeScript frontend
│   ├── src/
│   │   ├── api/        # API client
│   │   ├── components/ # UI components
│   │   ├── pages/      # Page components
│   │   ├── store/      # Zustand state management
│   │   └── types/      # TypeScript types
│   └── package.json
│
├── data/                # Hardware and model databases (JSON)
│   ├── hf_models.json  # 536+ LLM models
│   ├── gpu_specs.json  # 59+ GPU configurations
│   ├── cpu_specs.json  # 46+ CPU configurations
│   └── ram_specs.json  # RAM specifications
│
└── docs/                # Documentation
```

## 🔧 API Endpoints

The backend provides REST API endpoints:

- **POST** `/api/calculate` - Calculate hardware recommendations
- **GET** `/api/models?q=search&limit=20` - Search for models
- **GET** `/api/models/{model_id}` - Get specific model details
- **GET** `/api/hardware/gpus?q=search` - Search GPUs
- **GET** `/api/hardware/cpus?q=search` - Search CPUs

API documentation available at: **http://localhost:8000/docs** (when backend is running)

## 📊 What Gets Calculated

### Memory Estimation
```
total_memory = model_weights + kv_cache + overhead
```
- Model weights depend on parameter count and quantization level
- KV cache grows with context length
- Overhead includes activation memory and system buffers

### Speed Estimation
```
tokens/sec = (gpu_bandwidth / model_size) × efficiency_factor
```
- Bandwidth-limited for GPU inference
- Backend-specific constants for CPU inference
- Special handling for MoE (Mixture of Experts) models

### Hardware Tiers
- **Minimum**: Meets requirements with minimal headroom (~10%)
- **Ideal**: Balanced with comfortable headroom (~25%)
- **Best**: High-performance with maximum headroom (50%+)

## 🎯 Features

✅ **Hardware Recommendations**
- GPU, CPU, and RAM specifications
- Multiple configuration tiers
- Cost estimates (MSRP-based)
- Power consumption calculations

✅ **Performance Metrics**
- Tokens per second (tok/s)
- Latency estimates
- VRAM usage visualization
- Bottleneck detection

✅ **Model Support**
- 536+ pre-configured LLM models
- Automatic quantization selection (Q2_K to Q8_0)
- MoE model support
- Custom model configuration

✅ **Deployment Modes**
- Concurrent (parallel execution)
- Sequential (queue-based)
- Batched (resource sharing)

## 🛠️ Development

### Backend Development
```bash
cd backend
uv sync                    # Install/update dependencies
uv run python run_server.py  # Run server
uv run pytest             # Run tests (if available)
```

### Frontend Development
```bash
cd frontend
npm install               # Install dependencies
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
```

### Adding New Models
Edit `data/hf_models.json`:
```json
{
  "name": "your-model-name",
  "provider": "Provider",
  "parameter_count": "7B",
  "parameters_raw": 7000000000,
  "context_length": 4096,
  "use_case": "general",
  "is_moe": false
}
```

### Adding New Hardware
Edit `data/gpu_specs.json` or `data/cpu_specs.json`:
```json
{
  "name": "NVIDIA RTX 5090",
  "short_name": "RTX 5090",
  "vram_gb": 32,
  "vram_bandwidth_gbps": 1500,
  "tdp_watts": 450,
  "msrp_usd": 1999
}
```

## 🐛 Troubleshooting

**Backend won't start:**
- Ensure Python 3.13+ is installed
- Install `uv`: `pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`
- Run `uv sync` to install dependencies

**Frontend won't start:**
- Ensure Node.js 22.1+ is installed
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- Check that port 5173 is not in use

**"No model found" error:**
- Check model name spelling
- Browse available models at `http://localhost:8000/api/models?q=&limit=100`
- Model names are case-insensitive and fuzzy-matched

**Backend/Frontend communication issues:**
- Ensure both servers are running
- Check browser console for CORS errors
- Verify backend is on port 8000 and frontend on port 5173

## 📚 Documentation

- [Development Plan](../docs/LLMCALCULATOR_DEV_PLAN.md) - Complete development roadmap
- [Backend Status](../docs/DEVELOPMENT_STATUS.md) - Backend implementation details
- [Frontend Setup](../docs/FRONTEND_SETUP_COMPLETE.md) - Frontend architecture
- [Architecture Reference](../docs/LLMFIT_ARCHITECTURE.md) - Core algorithms and design

## 💡 Tips

- **Model Names**: Use common names like `llama-3`, `mistral-7b`, `qwen-2.5` - fuzzy matching will find them
- **Context Size**: Larger contexts require more VRAM; start with 4K for testing
- **Multi-Model**: For model swarms, use "Batched" mode for better resource sharing
- **Budget**: Check the "Minimum" tier for most cost-effective options
- **Performance**: "Best" tier is optimized for maximum throughput

## 📄 Technology Stack

**Backend:**
- FastAPI (Python web framework)
- Pydantic v2 (data validation)
- uvicorn (ASGI server)
- NumPy (numerical calculations)

**Frontend:**
- React 18 (UI framework)
- TypeScript (type safety)
- Vite (build tool)
- Tailwind CSS (styling)
- Zustand (state management)
- Axios (HTTP client)
- Lucide React (icons)

## 🤝 Contributing

Contributions welcome! The calculator uses:
- Comprehensive JSON databases for models and hardware
- Bandwidth-based throughput estimation
- Multi-tier scoring system for hardware classification

## 📝 License

See project license file.

---

**Questions?** Check the API docs at `http://localhost:8000/docs` or explore the codebase documentation in the `docs/` folder.
