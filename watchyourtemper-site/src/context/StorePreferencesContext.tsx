/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchStorePreferences, type StoreCountryPreference } from '../lib/storeApi';

type StorePreferencesContextValue = {
  countries: StoreCountryPreference[];
  currencies: string[];
  exchangeRates: Record<string, number>;
  baseCurrency: string;
  supportEmail: string;
  selectedCountry: string;
  selectedCurrency: string;
  detectedCountry: string;
  loading: boolean;
  setSelectedCountry: (country: string) => void;
  setSelectedCurrency: (currency: string) => void;
};

const COUNTRY_STORAGE_KEY = 'wyt-store-country';
const CURRENCY_STORAGE_KEY = 'wyt-store-currency';
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  AU: 'AUD',
  CA: 'CAD',
  GB: 'GBP',
  DE: 'EUR',
  ES: 'EUR',
  FR: 'EUR',
  IE: 'EUR',
  IT: 'EUR',
  JP: 'JPY',
  NZ: 'NZD',
  US: 'USD',
};

const StorePreferencesContext = createContext<StorePreferencesContextValue | null>(null);

export const StorePreferencesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [countries, setCountries] = useState<StoreCountryPreference[]>([]);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountryState] = useState('US');
  const [selectedCurrency, setSelectedCurrencyState] = useState('USD');
  const [detectedCountry, setDetectedCountry] = useState('US');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ USD: 1 });
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [supportEmail, setSupportEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const payload = await fetchStorePreferences();
        if (!active) {
          return;
        }

        const storedCountry = typeof window !== 'undefined' ? window.localStorage.getItem(COUNTRY_STORAGE_KEY) : null;
        const storedCurrency = typeof window !== 'undefined' ? window.localStorage.getItem(CURRENCY_STORAGE_KEY) : null;

        setCountries(payload.countries);
        setCurrencies(payload.currencies);
        setDetectedCountry(payload.detectedCountry);
        setExchangeRates(payload.exchangeRates);
        setBaseCurrency(payload.baseCurrency);
        setSupportEmail(payload.supportEmail);
        setSelectedCountryState(storedCountry || payload.detectedCountry || 'US');
        setSelectedCurrencyState(storedCurrency || payload.defaultCurrency || 'USD');
      } catch {
        if (!active) {
          return;
        }

        setSelectedCountryState('US');
        setSelectedCurrencyState('USD');
        setExchangeRates({ USD: 1 });
        setBaseCurrency('USD');
        setSupportEmail('');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<StorePreferencesContextValue>(
    () => ({
      countries,
      currencies,
      exchangeRates,
      baseCurrency,
      supportEmail,
      selectedCountry,
      selectedCurrency,
      detectedCountry,
      loading,
      setSelectedCountry: (country) => {
        const nextCountry = country.toUpperCase();
        const nextCurrency = COUNTRY_TO_CURRENCY[nextCountry] || 'USD';
        setSelectedCountryState(nextCountry);
        setSelectedCurrencyState(nextCurrency);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(COUNTRY_STORAGE_KEY, nextCountry);
          window.localStorage.setItem(CURRENCY_STORAGE_KEY, nextCurrency);
        }
      },
      setSelectedCurrency: (currency) => {
        const nextCurrency = currency.toUpperCase();
        setSelectedCurrencyState(nextCurrency);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(CURRENCY_STORAGE_KEY, nextCurrency);
        }
      },
    }),
    [baseCurrency, countries, currencies, detectedCountry, exchangeRates, loading, selectedCountry, selectedCurrency, supportEmail],
  );

  return <StorePreferencesContext.Provider value={value}>{children}</StorePreferencesContext.Provider>;
};

export const useStorePreferences = () => {
  const value = useContext(StorePreferencesContext);
  if (!value) {
    throw new Error('useStorePreferences must be used within StorePreferencesProvider');
  }

  return value;
};
