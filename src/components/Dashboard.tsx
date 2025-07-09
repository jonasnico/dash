import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Button from "@/components/ui/button";
import {
  RefreshCw,
  CloudRain,
  Sun,
  Cloud,
  GitBranch,
  Star,
  GitFork,
  Zap,
} from "lucide-react";
import type {
  UselessFact,
  WeatherData,
  GitHubEvent,
  CurrentWeather,
} from "@/types";
import ThemeToggle from "./ThemeToggle";
import { fetchOsloWeather } from "@/services/weatherService";

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

  const fetchWeather = async () => {
    setWeatherLoading(true);
    setWeatherError(null);

    try {
      const weatherData = await fetchOsloWeather();
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
    fetchWeather();
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="relative">
          <div className="absolute top-0 right-0 flex gap-3">
            <ThemeToggle />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-heading text-foreground">The Dash</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="border-4 border-border shadow-shadow bg-performance-card text-performance-card-foreground">
            <CardHeader className="text-center">
              <CardTitle className="text-4xl font-heading flex items-center justify-center gap-3">
                <Zap className="h-10 w-10" />
                Password Performance Lab
              </CardTitle>
              <CardDescription className="text-performance-card-foreground/80 text-lg mt-4">
                Compare JavaScript vs Rust WebAssembly performance in real-time
                benchmarks
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="bg-performance-card-foreground/10 border-2 border-performance-card-foreground/20 rounded-base p-6">
                <h3 className="text-xl font-heading mb-4">Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-weight-heading">
                      🦀 Rust WebAssembly
                    </div>
                    <div className="opacity-80">
                      High-performance password analysis
                    </div>
                  </div>
                  <div>
                    <div className="font-weight-heading">
                      📊 Statistical Analysis
                    </div>
                    <div className="opacity-80">
                      Precision benchmarking with outlier detection
                    </div>
                  </div>
                  <div>
                    <div className="font-weight-heading">
                      ⚡ Real-time Comparison
                    </div>
                    <div className="opacity-80">
                      Live performance metrics and insights
                    </div>
                  </div>
                </div>
              </div>

              <Link to="/password-performance">
                <Button
                  variant="reverse"
                  size="lg"
                  className="text-lg px-8 py-6"
                >
                  Launch Performance Lab
                </Button>
              </Link>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-border shadow-sm bg-secondary-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-heading">
                  Daily Fact
                </CardTitle>
                <CardDescription className="text-sm">
                  Random knowledge
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {loading && (
                  <div className="text-center py-6">
                    <div className="text-sm">Loading fact...</div>
                  </div>
                )}

                {error && (
                  <div className="text-red-800 bg-red-100 p-3 rounded-base border-2 border-red-300 text-sm">
                    Error: {error}
                  </div>
                )}

                {fact && !loading && (
                  <div className="space-y-3">
                    <blockquote className="text-sm text-foreground leading-relaxed italic">
                      "{fact.text}"
                    </blockquote>
                    <div className="flex justify-between items-center pt-2 border-t border-border/20">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={fetchUselessFact}
                        disabled={loading}
                        className="text-xs gap-1"
                      >
                        <RefreshCw
                          size={12}
                          className={loading ? "animate-spin" : ""}
                        />
                        New
                      </Button>
                      <Button
                        variant="neutral"
                        size="sm"
                        onClick={() => window.open(fact.permalink, "_blank")}
                        className="text-xs"
                      >
                        Source
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-border shadow-sm bg-secondary-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-heading">
                  Oslo Weather
                </CardTitle>
                <CardDescription className="text-sm">
                  Current conditions
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {weatherLoading && (
                  <div className="text-center py-6">
                    <div className="text-sm">Loading weather...</div>
                  </div>
                )}

                {weatherError && (
                  <div className="text-red-600 bg-red-50 p-3 rounded-base border-2 border-red-200 text-sm">
                    {weatherError}
                  </div>
                )}

                {weather &&
                  !weatherLoading &&
                  (() => {
                    const todaysWeather = getCurrentTodaysWeather();
                    if (!todaysWeather) return null;

                    const WeatherIcon = getWeatherIcon(
                      todaysWeather.symbolCode
                    );

                    return (
                      <div className="space-y-3">
                        <div className="text-center border-2 border-border rounded-base p-4 bg-secondary-background">
                          <div className="flex items-center justify-center mb-2">
                            <WeatherIcon size={24} className="text-main" />
                          </div>
                          <div className="text-2xl font-heading text-main">
                            {todaysWeather.temperature}°C
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center border border-border rounded p-2 bg-secondary-background">
                            <div className="font-heading text-main">
                              {todaysWeather.humidity}%
                            </div>
                            <div className="text-foreground/70">Humidity</div>
                          </div>
                          <div className="text-center border border-border rounded p-2 bg-secondary-background">
                            <div className="font-heading text-main">
                              {todaysWeather.windSpeed} m/s
                            </div>
                            <div className="text-foreground/70">Wind</div>
                          </div>
                        </div>

                        <Button
                          variant="default"
                          size="sm"
                          onClick={fetchWeather}
                          disabled={weatherLoading}
                          className="text-xs w-full gap-1"
                        >
                          <RefreshCw
                            size={12}
                            className={weatherLoading ? "animate-spin" : ""}
                          />
                          Refresh
                        </Button>
                      </div>
                    );
                  })()}
              </CardContent>
            </Card>

            <Card className="border-2 border-border shadow-sm bg-secondary-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-heading">
                  GitHub Activity
                </CardTitle>
                <CardDescription className="text-sm">
                  Recent commits by{" "}
                  <Link to="https://github.com/jonasnico">jonasnico</Link>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {githubLoading && (
                  <div className="text-center py-6">
                    <div className="text-sm">Loading activity...</div>
                  </div>
                )}

                {githubError && (
                  <div className="text-red-600 bg-red-50 p-3 rounded-base border-2 border-red-200 text-sm">
                    {githubError}
                  </div>
                )}

                {githubActivity.length > 0 && !githubLoading && (
                  <div className="space-y-2">
                    {githubActivity.slice(0, 3).map((event) => {
                      const ActivityIcon = getActivityIcon(event.type);

                      return (
                        <div
                          key={event.id}
                          className="border border-border rounded p-2 bg-secondary-background"
                        >
                          <div className="flex items-start space-x-2">
                            <ActivityIcon
                              size={14}
                              className="text-main mt-0.5 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground leading-tight">
                                {formatActivityDescription(event)}
                              </p>
                              <p className="text-xs text-foreground/60">
                                {formatTimeAgo(event.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <Button
                      variant="default"
                      size="sm"
                      onClick={fetchGitHubActivity}
                      disabled={githubLoading}
                      className="text-xs w-full gap-1 mt-2"
                    >
                      <RefreshCw
                        size={12}
                        className={githubLoading ? "animate-spin" : ""}
                      />
                      Refresh
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

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
