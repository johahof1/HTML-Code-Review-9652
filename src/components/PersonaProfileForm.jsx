import React, { useState, useEffect, useRef } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const PersonaProfileForm = () => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    beruf: '',
    age: '',
    region: 'Deutschland gesamt',
    household: 'One person',
    education: 'Hauptschulabschluss',
    gender: 'Male',
    description: ''
  });
  
  // Autocomplete states
  const [berufeArray, setBerufeArray] = useState([]);
  const [berufslisteGeladen, setBerufslisteGeladen] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [berufSuggestions, setBerufSuggestions] = useState([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showBerufSuggestions, setShowBerufSuggestions] = useState(false);
  const [selectedNameIndex, setSelectedNameIndex] = useState(-1);
  const [selectedBerufIndex, setSelectedBerufIndex] = useState(-1);
  
  // Traits state
  const [selectedTraits, setSelectedTraits] = useState([]);
  const [responseMessage, setResponseMessage] = useState({ text: '', isError: false });
  
  // Refs for handling click outside
  const nameSuggestionsRef = useRef(null);
  const berufSuggestionsRef = useRef(null);
  
  // Mock name list (in a real app, this might come from an API)
  const nameList = [
    "Miriam Mustermann", "Jan Scholz", "Aylin Öztürk", "Lisa Schröder",
    "Jonas Becker", "Maximilian Roth", "Chiara Brandt", "Leon Schmidt",
    "Nora König", "Fatma Yılmaz"
  ];
  
  // Available traits
  const availableTraits = [
    "Analytical", "Empathetic", "Creative", "Detail-oriented", "Team player",
    "Innovative", "Resilient", "Strategic", "Curious", "Ambitious",
    "Adaptable", "Proactive", "Persistent", "Organized", "Dependable",
    "Communicative", "Independent", "Practical", "Optimistic", "Resourceful"
  ];

  // Load Berufe list on component mount
  useEffect(() => {
    const fetchBerufe = async () => {
      try {
        const response = await fetch("http://localhost:5678/webhook/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: "berufe" })
        });
        
        if (!response.ok) {
          throw new Error("Fehler beim Laden der Berufsliste");
        }
        
        const data = await response.json();
        
        if (!data.berufe || !Array.isArray(data.berufe) || data.berufe.length === 0) {
          throw new Error("Ungültige oder leere Berufsdaten");
        }
        
        setBerufeArray(data.berufe);
        setBerufslisteGeladen(true);
      } catch (error) {
        console.error("Berufe-Fehler:", error);
        setBerufslisteGeladen(false);
        setBerufeArray([]);
      }
    };
    
    fetchBerufe();
  }, []);
  
  // Handle clicks outside the suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (nameSuggestionsRef.current && !nameSuggestionsRef.current.contains(event.target)) {
        setShowNameSuggestions(false);
      }
      if (berufSuggestionsRef.current && !berufSuggestionsRef.current.contains(event.target)) {
        setShowBerufSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Handle autocomplete for name and beruf
    if (name === 'name') {
      const filtered = value ? nameList.filter(n => 
        n.toLowerCase().includes(value.toLowerCase())
      ) : [];
      setNameSuggestions(filtered);
      setShowNameSuggestions(filtered.length > 0);
      setSelectedNameIndex(-1);
    } else if (name === 'beruf') {
      const filtered = value && berufeArray.length > 0 ? berufeArray.filter(b => 
        b.toLowerCase().includes(value.toLowerCase())
      ) : [];
      setBerufSuggestions(filtered);
      setShowBerufSuggestions(filtered.length > 0);
      setSelectedBerufIndex(-1);
    }
  };
  
  // Handle keydown for autocomplete navigation
  const handleKeyDown = (e, suggestions, setSelectedIndex, selectedIndex, setShowSuggestions, setSuggestions, fieldName) => {
    if (!suggestions || suggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prevIndex) => (prevIndex + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prevIndex) => (prevIndex - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      setFormData(prev => ({ ...prev, [fieldName]: suggestions[selectedIndex] }));
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowSuggestions(false);
    }
  };
  
  // Handle suggestion selection
  const handleSuggestionClick = (suggestion, fieldName, setShowSuggestions) => {
    setFormData(prev => ({ ...prev, [fieldName]: suggestion }));
    setShowSuggestions(false);
  };
  
  // Add trait
  const handleAddTrait = (e) => {
    const trait = e.target.value;
    if (trait && trait !== 'Choose a trait' && !selectedTraits.includes(trait)) {
      setSelectedTraits(prev => [...prev, trait]);
    }
    e.target.value = 'Choose a trait'; // Reset select
  };
  
  // Remove trait
  const handleRemoveTrait = (traitToRemove) => {
    setSelectedTraits(prev => prev.filter(trait => trait !== traitToRemove));
  };
  
  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      traits: selectedTraits
    };
    
    try {
      const response = await fetch("http://localhost:5678/webhook/external_form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      setResponseMessage({ text: "Erfolgreich gesendet.", isError: false });
    } catch (error) {
      console.error("Form submission error:", error);
      setResponseMessage({ text: "Fehler beim Senden.", isError: true });
    }
  };
  
  // Check if form is valid
  const isFormValid = berufslisteGeladen && formData.beruf.trim() !== '';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-6">Persona Profile</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4 relative">
          {/* Name input with autocomplete */}
          <div className="relative">
            <label className="block mb-1 font-medium">Persona name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name}
              onChange={handleInputChange}
              onKeyDown={(e) => handleKeyDown(
                e, nameSuggestions, setSelectedNameIndex, selectedNameIndex, 
                setShowNameSuggestions, setNameSuggestions, 'name'
              )}
              onFocus={() => setShowNameSuggestions(nameSuggestions.length > 0)}
              placeholder="Miriam Mustermann" 
              required 
              autoComplete="off"
              className="w-full border border-gray-300 rounded px-4 py-2"
            />
            
            {/* Name suggestions */}
            {showNameSuggestions && (
              <ul 
                ref={nameSuggestionsRef}
                className="absolute z-10 w-full bg-white border border-gray-300 rounded shadow mt-1 max-h-48 overflow-y-auto"
              >
                {nameSuggestions.map((name, index) => (
                  <li 
                    key={name}
                    className={`px-4 py-2 hover:bg-blue-100 cursor-pointer ${index === selectedNameIndex ? 'bg-blue-50 font-semibold' : ''}`}
                    onClick={() => handleSuggestionClick(name, 'name', setShowNameSuggestions)}
                  >
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Beruf input with autocomplete */}
          <div className="relative">
            <label className="block mb-1 font-medium">Beruf</label>
            <input 
              type="text" 
              name="beruf" 
              value={formData.beruf}
              onChange={handleInputChange}
              onKeyDown={(e) => handleKeyDown(
                e, berufSuggestions, setSelectedBerufIndex, selectedBerufIndex, 
                setShowBerufSuggestions, setBerufSuggestions, 'beruf'
              )}
              onFocus={() => setShowBerufSuggestions(berufSuggestions.length > 0)}
              placeholder="z. B. Gärtner" 
              required 
              autoComplete="off"
              className="w-full border border-gray-300 rounded px-4 py-2"
            />
            
            {/* Beruf suggestions */}
            {showBerufSuggestions && (
              <ul 
                ref={berufSuggestionsRef}
                className="absolute z-10 w-full bg-white border border-gray-300 rounded shadow mt-1 max-h-48 overflow-y-auto"
              >
                {berufSuggestions.map((beruf, index) => (
                  <li 
                    key={beruf}
                    className={`px-4 py-2 hover:bg-blue-100 cursor-pointer ${index === selectedBerufIndex ? 'bg-blue-50 font-semibold' : ''}`}
                    onClick={() => handleSuggestionClick(beruf, 'beruf', setShowBerufSuggestions)}
                  >
                    {beruf}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Age input */}
          <div>
            <label className="block mb-1 font-medium">Age</label>
            <input 
              type="number" 
              name="age" 
              value={formData.age}
              onChange={handleInputChange}
              min="0" 
              max="110" 
              required
              placeholder="Alter in Jahren"
              className="w-full border border-gray-300 rounded px-4 py-2" 
            />
          </div>
          
          {/* Region select */}
          <div>
            <label className="block mb-1 font-medium">Region</label>
            <select 
              name="region" 
              value={formData.region}
              onChange={handleInputChange}
              required 
              className="w-full border border-gray-300 rounded px-4 py-2"
            >
              <option>Deutschland gesamt</option>
              <option>Baden-Württemberg</option>
              <option>Bayern</option>
              <option>Berlin</option>
              <option>Brandenburg</option>
              <option>Bremen</option>
              <option>Hamburg</option>
              <option>Hessen</option>
              <option>Mecklenburg-Vorpommern</option>
              <option>Niedersachsen</option>
              <option>Nordrhein-Westfalen</option>
              <option>Rheinland-Pfalz</option>
              <option>Saarland</option>
              <option>Sachsen</option>
              <option>Sachsen-Anhalt</option>
              <option>Schleswig-Holstein</option>
              <option>Thüringen</option>
            </select>
          </div>
          
          {/* Household select */}
          <div>
            <label className="block mb-1 font-medium">Household</label>
            <select 
              name="household" 
              value={formData.household}
              onChange={handleInputChange}
              required 
              className="w-full border border-gray-300 rounded px-4 py-2"
            >
              <option>One person</option>
              <option>Couple</option>
              <option>Couple with Child(ren)</option>
              <option>Single parent</option>
            </select>
          </div>
          
          {/* Education select */}
          <div>
            <label className="block mb-1 font-medium">Education</label>
            <select 
              name="education" 
              value={formData.education}
              onChange={handleInputChange}
              required 
              className="w-full border border-gray-300 rounded px-4 py-2"
            >
              <option>Hauptschulabschluss</option>
              <option>Realschulabschluss</option>
              <option>Abitur</option>
              <option>Berufsausbildung</option>
              <option>Hochschulabschluss</option>
            </select>
          </div>
          
          {/* Gender select */}
          <div>
            <label className="block mb-1 font-medium">Gender</label>
            <select 
              name="gender" 
              value={formData.gender}
              onChange={handleInputChange}
              required 
              className="w-full border border-gray-300 rounded px-4 py-2"
            >
              <option>Male</option>
              <option>Female</option>
              <option>Diverse</option>
            </select>
          </div>
          
          {/* NEW SECTION: Personality Traits */}
          <div>
            <label htmlFor="traitSelect" className="block mb-1 font-medium">Personality Traits</label>
            <select 
              id="traitSelect" 
              onChange={handleAddTrait}
              className="w-full border border-gray-300 rounded px-4 py-2"
            >
              <option disabled selected>Choose a trait</option>
              {availableTraits.map(trait => (
                <option key={trait} value={trait} disabled={selectedTraits.includes(trait)}>
                  {trait}
                </option>
              ))}
            </select>
            
            {/* Selected traits display */}
            <div className="mt-2 flex flex-wrap">
              {selectedTraits.map(trait => (
                <span 
                  key={trait} 
                  className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full mr-2 mb-2"
                >
                  {trait}
                  <span 
                    className="ml-2 text-blue-500 hover:text-blue-700 cursor-pointer"
                    onClick={() => handleRemoveTrait(trait)}
                  >
                    &times;
                  </span>
                </span>
              ))}
            </div>
          </div>
          
          {/* NEW SECTION: Description */}
          <div>
            <label htmlFor="description" className="block mb-1 font-medium">Description</label>
            <textarea 
              name="description" 
              value={formData.description}
              onChange={handleInputChange}
              rows="3" 
              placeholder="Describe the persona briefly..."
              className="w-full border border-gray-300 rounded px-4 py-2"
            />
          </div>
          
          {/* Submit button */}
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={!isFormValid}
              className={`px-6 py-2 rounded ${
                isFormValid 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Submit
            </button>
          </div>
        </form>
        
        {/* Response message */}
        {responseMessage.text && (
          <div className={`mt-6 text-sm font-medium ${
            responseMessage.isError ? 'text-red-600' : 'text-green-600'
          }`}>
            {responseMessage.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonaProfileForm;