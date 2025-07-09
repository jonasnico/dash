import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { RefreshCw, CloudRain, Sun, Cloud } from "lucide-react";

interface UselessFact {
  id: string;
  text: string;
  source: string;
  source_url: string;
  language: string;
  permalink: string;
}

interface WeatherData {
  properties: {
    timeseries: Array<{
      time: string;
      data: {
        instant: {
          details: {
            air_temperature: number;
            relative_humidity: number;
            wind_speed: number;
          };
        };
        next_6_hours?: {
          summary: {
            symbol_code: string;
          };
          details: {
            precipitation_amount: number;
          };
        };
      };
    }>;
  };
}

const Dashboard: React.FC = () => {
  const [fact, setFact] = useState<UselessFact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const fetchUselessFact = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://uselessfacts.jsph.pl/api/v2/facts/random"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch fact");
      }
      const data = await response.json();
      setFact(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const fetchOsloWeather = async () => {
    setWeatherLoading(true);
    setWeatherError(null);

    try {
      const osloLatitude = 59.9139;
      const osloLongitude = 10.7522;

      const response = await fetch(
        `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${osloLatitude}&lon=${osloLongitude}`,
        {
          headers: {
            "User-Agent": "NeobrutalistDashboard/1.0 (dashboard@example.com)",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const weatherData = await response.json();
      setWeather(weatherData);
    } catch (err) {
      setWeatherError(
        err instanceof Error ? err.message : "Failed to load weather"
      );
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchUselessFact();
    fetchOsloWeather();
  }, []);

  const getWeatherIcon = (symbolCode: string) => {
    if (symbolCode.includes("rain")) return CloudRain;
    if (symbolCode.includes("cloud")) return Cloud;
    return Sun;
  };

  const getCurrentTodaysWeather = () => {
    if (!weather?.properties?.timeseries?.length) return null;

    const currentHour = weather.properties.timeseries[0];
    const todaysForecast = weather.properties.timeseries.find(
      (entry) => entry.data.next_6_hours
    );

    return {
      temperature: Math.round(currentHour.data.instant.details.air_temperature),
      humidity: currentHour.data.instant.details.relative_humidity,
      windSpeed: currentHour.data.instant.details.wind_speed,
      symbolCode:
        todaysForecast?.data.next_6_hours?.summary.symbol_code ||
        "clearsky_day",
      precipitation:
        todaysForecast?.data.next_6_hours?.details.precipitation_amount || 0,
    };
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-heading text-foreground">The Dash</h1>
          <p className="text-lg text-foreground">{getCurrentDate()}</p>
          <Badge variant="default" className="text-base px-4 py-2">
            {getCurrentTime()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-4 border-border shadow-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-3xl font-heading">
                  Today's Useless Fact
                </CardTitle>
                <CardDescription className="text-foreground/80 text-base mt-2">
                  Knowledge you never knew you needed
                </CardDescription>
              </div>
              <Button
                variant="default"
                size="icon"
                onClick={fetchUselessFact}
                disabled={loading}
                className={loading ? "animate-spin" : ""}
              >
                <RefreshCw size={20} />
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-foreground text-lg">
                    Loading amazing useless fact...
                  </div>
                </div>
              )}

              {error && (
                <div className="text-red-800 bg-red-100 p-6 rounded-base border-4 border-red-300 text-lg font-medium">
                  Error: {error}
                </div>
              )}

              {fact && !loading && (
                <div className="space-y-6">
                  <blockquote className="text-xl font-medium text-foreground leading-relaxed italic border-l-4 border-main pl-6">
                    "{fact.text}"
                  </blockquote>
                  <div className="flex justify-between items-center pt-4 border-t-2 border-border/20">
                    <Badge variant="default" className="text-sm">
                      Fact #{fact.id}
                    </Badge>
                    <Button
                      variant="neutral"
                      size="sm"
                      onClick={() => window.open(fact.permalink, "_blank")}
                      className="text-xs"
                    >
                      JSON
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-4 border-border shadow-shadow">
            <CardHeader>
              <CardTitle className="text-3xl font-heading">
                Oslo Weather
              </CardTitle>
              <CardDescription className="text-base">
                Current conditions in Norway's capital
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {weatherLoading && (
                <div className="text-center text-foreground py-12">
                  <div className="text-lg">Loading weather...</div>
                </div>
              )}

              {weatherError && (
                <div className="text-red-600 bg-red-50 p-6 rounded-base border-4 border-red-200 text-lg font-medium">
                  {weatherError}
                </div>
              )}

              {weather &&
                !weatherLoading &&
                (() => {
                  const todaysWeather = getCurrentTodaysWeather();
                  if (!todaysWeather) return null;

                  const WeatherIcon = getWeatherIcon(todaysWeather.symbolCode);

                  return (
                    <div className="space-y-6">
                      <div className="text-center border-4 border-border rounded-base p-6 bg-secondary-background">
                        <div className="flex items-center justify-center mb-4">
                          <WeatherIcon size={48} className="text-main" />
                        </div>
                        <div className="text-5xl font-heading text-main mb-2">
                          {todaysWeather.temperature}°C
                        </div>
                        <div className="text-lg text-foreground font-medium">
                          Temperature
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center border-2 border-border rounded-base p-4 bg-secondary-background">
                          <div className="text-2xl font-heading text-main">
                            {todaysWeather.humidity}%
                          </div>
                          <div className="text-sm text-foreground">
                            Humidity
                          </div>
                        </div>

                        <div className="text-center border-2 border-border rounded-base p-4 bg-secondary-background">
                          <div className="text-2xl font-heading text-main">
                            {todaysWeather.windSpeed} m/s
                          </div>
                          <div className="text-sm text-foreground">
                            Wind Speed
                          </div>
                        </div>
                      </div>

                      {todaysWeather.precipitation > 0 && (
                        <div className="text-center border-2 border-border rounded-base p-4 bg-secondary-background">
                          <div className="text-2xl font-heading text-main">
                            {todaysWeather.precipitation} mm
                          </div>
                          <div className="text-sm text-foreground">
                            Precipitation
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 border-border">
          <CardHeader>
            <CardTitle className="font-heading text-center">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button onClick={fetchUselessFact} disabled={loading}>
                New Fact
              </Button>
              <Button onClick={fetchOsloWeather} disabled={weatherLoading}>
                Refresh Weather
              </Button>
              <Button
                variant="neutral"
                onClick={() => window.open(fact?.permalink || "#", "_blank")}
                disabled={!fact}
              >
                Go to JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-foreground border-t-2 border-border pt-4 space-y-1">
          <p>
            Facts provided by{" "}
            <a
              href="https://uselessfacts.jsph.pl/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              Useless Facts API
            </a>
          </p>
          <p>
            Weather data from{" "}
            <a
              href="https://developer.yr.no/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              Yr.no (Norwegian Meteorological Institute)
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
