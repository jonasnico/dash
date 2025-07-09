import type { WeatherData } from "@/types";

const CACHE_KEY = "oslo_weather_cache";
const CACHE_DURATION = 10 * 60 * 1000; // 10 min

interface CachedWeatherData {
  data: WeatherData;
  timestamp: number;
  expires?: string;
}

export const fetchOsloWeather = async (): Promise<WeatherData> => {
  const cached = getCachedWeather();
  if (cached) {
    return cached;
  }

  const osloLatitude = 59.9139;
  const osloLongitude = 10.7522;

  try {
    
    // https://developer.yr.no/doc/TermsOfService/
    const response = await fetch(
      `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${osloLatitude}&lon=${osloLongitude}`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    const weatherData = await response.json();
    
    const expires = response.headers.get("expires");
    cacheWeatherData(weatherData, expires);
    
    return weatherData;
  } catch (error) {
    const expiredCache = getExpiredCachedWeather();
    if (expiredCache) {
      console.warn("Using expired weather cache due to API error:", error);
      return expiredCache;
    }
    
    throw error;
  }
};

const getCachedWeather = (): WeatherData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsedCache: CachedWeatherData = JSON.parse(cached);
    const now = Date.now();
    
    if (parsedCache.expires) {
      const expiresTime = new Date(parsedCache.expires).getTime();
      if (now < expiresTime) {
        return parsedCache.data;
      }
    } else if (now - parsedCache.timestamp < CACHE_DURATION) {
      return parsedCache.data;
    }

    return null;
  } catch (error) {
    console.warn("Error reading weather cache:", error);
    return null;
  }
};

const getExpiredCachedWeather = (): WeatherData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsedCache: CachedWeatherData = JSON.parse(cached);
    return parsedCache.data;
  } catch (error) {
    console.warn("Error reading expired weather cache:", error);
    return null;
  }
};

const cacheWeatherData = (data: WeatherData, expires?: string | null): void => {
  try {
    const cacheData: CachedWeatherData = {
      data,
      timestamp: Date.now(),
      ...(expires && { expires })
    };
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn("Error caching weather data:", error);
  }
};
