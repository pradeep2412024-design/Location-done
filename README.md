# CropWise AI - Clean Version

A comprehensive agricultural AI system for crop recommendations, yield predictions, and farm management.

## Features

- **Crop Recommendations**: AI-powered crop suggestions based on location, season, soil, and weather
- **Yield Predictions**: Accurate yield forecasting with confidence levels
- **Soil Health Analysis**: Comprehensive soil health scoring and recommendations
- **Weather Risk Assessment**: Weather-based risk analysis and mitigation strategies
- **Priority Tasks**: Actionable farming tasks prioritized by urgency
- **Multi-language Support**: English, Hindi, and Odia language support
- **Multi-state Database**: Comprehensive agricultural data for Indian states

## Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Open Browser**: Navigate to `http://localhost:3000`

## Environment Variables

Create a `.env.local` file in the project root with:

```bash
GROQ_API_KEY=your_groq_api_key_here
```

## Project Structure

```
cropwiseaijs-clean/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # UI components
│   └── ...               # Feature components
├── i18n/                 # Internationalization
├── lib/                  # Utility libraries
├── public/               # Static assets
├── complete_agricultural_database.json  # Main database
└── multi_state_agricultural_data.json   # Multi-state data
```

## Key Components

- **Dashboard**: Main interface with crop analysis and recommendations
- **Crop Recommendations**: Enhanced recommendations with filtering and sorting
- **Farm Details Form**: Dynamic form for farm information input
- **Chatbot**: AI-powered agricultural assistant

## Database

The system uses two main databases:
- `complete_agricultural_database.json`: Comprehensive agricultural data
- `multi_state_agricultural_data.json`: Multi-state specific data

## API Endpoints

- `/api/crop-analysis`: Crop yield predictions and analysis
- `/api/crop-recommendations`: Enhanced crop recommendations
- `/api/soil`: Soil analysis and recommendations
- `/api/weather`: Weather data and risk assessment
- `/api/chatbot`: AI chatbot for agricultural queries

## Technologies Used

- **Next.js 14**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Shadcn/ui**: UI components
- **i18next**: Internationalization

## Deployment

The project is configured for deployment on Netlify with the included `netlify.toml` configuration.

## Security

- Do not commit real API keys. Use `.env.local` and keep it out of version control.
- Example env file: create `.env.example` (without real secrets).

## Support

For issues or questions, refer to the documentation files in the project root.
