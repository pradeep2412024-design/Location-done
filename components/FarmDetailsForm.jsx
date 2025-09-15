import { useI18n } from "@/i18n"

export default function FarmDetailsForm({ userInputData, setUserInputData, onSubmit, onCancel, isLoading, error }) {
  const { t } = useI18n()
  
  const handleInputChange = (field, value) => {
    setUserInputData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("[FarmDetailsForm] Form submitted with data:", userInputData)
    onSubmit(e)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location *
        </label>
        <input
          type="text"
          value={userInputData.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          placeholder="Enter your location (e.g., Hyderabad, Telangana)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Crop */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Crop *
        </label>
        <select
          value={userInputData.crop}
          onChange={(e) => handleInputChange('crop', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select a crop</option>
          <option value="Rice">Rice</option>
          <option value="Wheat">Wheat</option>
          <option value="Maize">Maize</option>
          <option value="Cotton">Cotton</option>
          <option value="Sugarcane">Sugarcane</option>
          <option value="Turmeric">Turmeric</option>
          <option value="Chilli">Chilli</option>
          <option value="Tomato">Tomato</option>
          <option value="Potato">Potato</option>
          <option value="Onion">Onion</option>
          <option value="Brinjal">Brinjal</option>
          <option value="Okra">Okra</option>
          <option value="Cucumber">Cucumber</option>
          <option value="Watermelon">Watermelon</option>
          <option value="Muskmelon">Muskmelon</option>
          <option value="Pumpkin">Pumpkin</option>
          <option value="Cauliflower">Cauliflower</option>
          <option value="Cabbage">Cabbage</option>
          <option value="Carrot">Carrot</option>
          <option value="Radish">Radish</option>
          <option value="Spinach">Spinach</option>
          <option value="Lettuce">Lettuce</option>
          <option value="Broccoli">Broccoli</option>
          <option value="Capsicum">Capsicum</option>
          <option value="Beetroot">Beetroot</option>
          <option value="Turnip">Turnip</option>
          <option value="Kohlrabi">Kohlrabi</option>
          <option value="Artichoke">Artichoke</option>
          <option value="Asparagus">Asparagus</option>
          <option value="Sweet Potato">Sweet Potato</option>
          <option value="Cassava">Cassava</option>
          <option value="Yam">Yam</option>
          <option value="Taro">Taro</option>
          <option value="Arrowroot">Arrowroot</option>
          <option value="Ginger">Ginger</option>
          <option value="Coriander">Coriander</option>
          <option value="Cumin">Cumin</option>
          <option value="Fenugreek">Fenugreek</option>
          <option value="Fennel">Fennel</option>
          <option value="Cardamom">Cardamom</option>
          <option value="Pepper">Pepper</option>
          <option value="Cloves">Cloves</option>
          <option value="Cinnamon">Cinnamon</option>
          <option value="Nutmeg">Nutmeg</option>
          <option value="Mace">Mace</option>
          <option value="Star Anise">Star Anise</option>
          <option value="Bay Leaves">Bay Leaves</option>
          <option value="Oregano">Oregano</option>
          <option value="Thyme">Thyme</option>
          <option value="Rosemary">Rosemary</option>
          <option value="Sage">Sage</option>
          <option value="Basil">Basil</option>
          <option value="Mint">Mint</option>
          <option value="Parsley">Parsley</option>
          <option value="Dill">Dill</option>
          <option value="Mango">Mango</option>
          <option value="Banana">Banana</option>
          <option value="Litchi">Litchi</option>
          <option value="Coconut">Coconut</option>
          <option value="Grapes">Grapes</option>
          <option value="Pomegranate">Pomegranate</option>
          <option value="Guava">Guava</option>
          <option value="Papaya">Papaya</option>
          <option value="Apple">Apple</option>
          <option value="Orange">Orange</option>
          <option value="Lemon">Lemon</option>
          <option value="Lime">Lime</option>
          <option value="Pineapple">Pineapple</option>
          <option value="Strawberry">Strawberry</option>
          <option value="Blueberry">Blueberry</option>
          <option value="Raspberry">Raspberry</option>
          <option value="Blackberry">Blackberry</option>
          <option value="Cranberry">Cranberry</option>
          <option value="Kiwi">Kiwi</option>
          <option value="Avocado">Avocado</option>
          <option value="Fig">Fig</option>
          <option value="Date">Date</option>
          <option value="Custard Apple">Custard Apple</option>
          <option value="Sapota">Sapota</option>
          <option value="Jackfruit">Jackfruit</option>
          <option value="Breadfruit">Breadfruit</option>
          <option value="Dragon Fruit">Dragon Fruit</option>
          <option value="Hemp">Hemp</option>
          <option value="Flax">Flax</option>
          <option value="Jute">Jute</option>
          <option value="Mesta">Mesta</option>
          <option value="Sisal">Sisal</option>
          <option value="Coir">Coir</option>
          <option value="Kapok">Kapok</option>
          <option value="Aloe Vera">Aloe Vera</option>
          <option value="Neem">Neem</option>
          <option value="Tulsi">Tulsi</option>
          <option value="Ashwagandha">Ashwagandha</option>
          <option value="Brahmi">Brahmi</option>
          <option value="Shatavari">Shatavari</option>
          <option value="Giloy">Giloy</option>
          <option value="Amla">Amla</option>
          <option value="Haritaki">Haritaki</option>
          <option value="Bibhitaki">Bibhitaki</option>
          <option value="Triphala">Triphala</option>
          <option value="Bamboo">Bamboo</option>
          <option value="Cashew">Cashew</option>
          <option value="Areca Nut">Areca Nut</option>
          <option value="Betel Nut">Betel Nut</option>
          <option value="Oil Palm">Oil Palm</option>
          <option value="Date Palm">Date Palm</option>
        </select>
      </div>

      {/* Month */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cultivation Month *
        </label>
        <select
          value={userInputData.month}
          onChange={(e) => handleInputChange('month', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select month</option>
          <option value="January">January</option>
          <option value="February">February</option>
          <option value="March">March</option>
          <option value="April">April</option>
          <option value="May">May</option>
          <option value="June">June</option>
          <option value="July">July</option>
          <option value="August">August</option>
          <option value="September">September</option>
          <option value="October">October</option>
          <option value="November">November</option>
          <option value="December">December</option>
        </select>
      </div>

      {/* Hectare */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Farm Size (Hectares) *
        </label>
        <input
          type="number"
          value={userInputData.hectare}
          onChange={(e) => handleInputChange('hectare', e.target.value)}
          placeholder="Enter farm size in hectares"
          min="0.1"
          step="0.1"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </span>
          ) : (
            'Update Farm Details'
          )}
        </button>
      </div>
    </form>
  )
}
