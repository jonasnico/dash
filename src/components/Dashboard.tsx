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
import {
  RefreshCw,
  CloudRain,
  Sun,
  Cloud,
  GitBranch,
  Star,
  GitFork,
} from "lucide-react";
import type {
  UselessFact,
  WeatherData,
  GitHubEvent,
  CurrentWeather,
} from "@/types";
import ThemeToggle from "./ThemeToggle";

const Dashboard: React.FC = () => {
  const [fact, setFact] = useState<UselessFact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [githubActivity, setGithubActivity] = useState<GitHubEvent[]>([]);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

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

  const fetchGitHubActivity = async () => {
    setGithubLoading(true);
    setGithubError(null);

    try {
      const response = await fetch(
        "https://api.github.com/users/jonasnico/events/public"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch GitHub activity");
      }

      const events = await response.json();
      setGithubActivity(events.slice(0, 5));
    } catch (err) {
      setGithubError(
        err instanceof Error ? err.message : "Failed to load GitHub activity"
      );
    } finally {
      setGithubLoading(false);
    }
  };

  useEffect(() => {
    fetchUselessFact();
    fetchOsloWeather();
    fetchGitHubActivity();
  }, []);

  const getActivityIcon = (eventType: string) => {
    switch (eventType) {
      case "PushEvent":
        return GitBranch;
      case "WatchEvent":
        return Star;
      case "ForkEvent":
        return GitFork;
      default:
        return GitBranch;
    }
  };

  const formatActivityDescription = (event: GitHubEvent) => {
    const repoName = event.repo.name.split("/")[1];

    switch (event.type) {
      case "PushEvent": {
        const commitCount = event.payload.commits?.length || 0;
        return `Pushed ${commitCount} commit${
          commitCount !== 1 ? "s" : ""
        } to ${repoName}`;
      }
      case "WatchEvent":
        return `Starred ${repoName}`;
      case "ForkEvent":
        return `Forked ${repoName}`;
      case "CreateEvent":
        return `Created ${
          event.payload.ref ? "branch" : "repository"
        } ${repoName}`;
      case "PullRequestEvent":
        return `${event.payload.action} PR in ${repoName}`;
      case "IssuesEvent":
        return `${event.payload.action} issue in ${repoName}`;
      default:
        return `Activity in ${repoName}`;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const eventDate = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getWeatherIcon = (symbolCode: string) => {
    if (symbolCode.includes("rain")) return CloudRain;
    if (symbolCode.includes("cloud")) return Cloud;
    return Sun;
  };

  const getCurrentTodaysWeather = (): CurrentWeather | null => {
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
        <div className="relative">
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-heading text-foreground">The Dash</h1>
            <p className="text-lg text-foreground">{getCurrentDate()}</p>
            <Badge variant="default" className="text-base px-4 py-2">
              {getCurrentTime()}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                      <div className="grid grid-cols-1 gap-4">
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

          <Card className="border-4 border-border shadow-shadow">
            <CardHeader>
              <CardTitle className="text-3xl font-heading">
                GitHub Activity
              </CardTitle>
              <CardDescription className="text-base">
                Recent dev activity for jonasnico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {githubLoading && (
                <div className="text-center text-foreground py-12">
                  <div className="text-lg">Loading activity...</div>
                </div>
              )}

              {githubError && (
                <div className="text-red-600 bg-red-50 p-6 rounded-base border-4 border-red-200 text-lg font-medium">
                  {githubError}
                </div>
              )}

              {githubActivity.length > 0 && !githubLoading && (
                <div className="space-y-3">
                  {githubActivity.map((event) => {
                    const ActivityIcon = getActivityIcon(event.type);

                    return (
                      <div
                        key={event.id}
                        className="border-2 border-border rounded-base p-4 bg-secondary-background"
                      >
                        <div className="flex items-start space-x-3">
                          <ActivityIcon
                            size={20}
                            className="text-main mt-1 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground leading-snug">
                              {formatActivityDescription(event)}
                            </p>
                            <p className="text-xs text-foreground/60 mt-1">
                              {formatTimeAgo(event.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
              <Button onClick={fetchGitHubActivity} disabled={githubLoading}>
                Refresh GitHub
              </Button>
              <Button
                variant="reverse"
                onClick={() =>
                  window.open("https://github.com/jonasnico", "_blank")
                }
              >
                View GitHub
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
