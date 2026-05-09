import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  ArrowRight,
} from "lucide-react";
import type {
  UselessFact,
  WeatherData,
  GitHubEvent,
  CurrentWeather,
} from "@/types";
import ThemeToggle from "./ThemeToggle";
import { fetchOsloWeather } from "@/services/weatherService";

const SectionLabel = ({
  number,
  title,
}: {
  number: string;
  title: string;
}) => (
  <div className="flex items-center gap-3 mb-6">
    <span className="font-heading text-xs text-main tracking-[0.3em] uppercase">
      {number} —
    </span>
    <span className="text-xs tracking-[0.3em] uppercase text-foreground/40">
      {title}
    </span>
    <div className="flex-1 h-px bg-border opacity-20" />
  </div>
);

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
      if (!response.ok) throw new Error("Failed to fetch fact");
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
      if (!response.ok) throw new Error("Failed to fetch GitHub activity");
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
        return `Pushed ${commitCount} commit${commitCount !== 1 ? "s" : ""} to ${repoName}`;
      }
      case "WatchEvent":
        return `Starred ${repoName}`;
      case "ForkEvent":
        return `Forked ${repoName}`;
      case "CreateEvent":
        return `Created ${event.payload.ref ? "branch" : "repo"} ${repoName}`;
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
    return `${Math.floor(diffInHours / 24)}d ago`;
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
    <div className="min-h-screen bg-background">
      <header className="border-b-4 border-border px-6 md:px-12 py-6">
        <div className="max-w-7xl mx-auto flex items-end justify-between gap-4">
          <div>
            <p className="font-heading text-xs text-main tracking-[0.3em] uppercase mb-1">
              01 — Personal Dashboard
            </p>
            <h1 className="font-heading text-[clamp(3.5rem,9vw,8rem)] leading-none tracking-tight text-foreground">
              THE DASH
            </h1>
          </div>
          <div className="flex flex-col items-end gap-2 pb-1">
            <ThemeToggle />
            <p className="text-[10px] tracking-[0.25em] uppercase text-foreground/30 hidden sm:block">
              Oslo, Norway
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 space-y-12">
        <section>
          <SectionLabel number="02" title="Featured" />
          <div
            className="relative overflow-hidden border-4 border-border shadow-shadow bg-main text-white"
            style={{
              backgroundImage:
                "repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.04) 10px, rgba(255,255,255,0.04) 20px)",
            }}
          >
            <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Zap className="h-7 w-7 shrink-0" />
                  <h2 className="font-heading text-3xl md:text-5xl leading-none tracking-tight uppercase">
                    Password Performance Lab
                  </h2>
                </div>

                <p className="text-white/70 text-base max-w-lg leading-relaxed">
                  Compare JavaScript vs Rust WebAssembly performance in
                  real-time benchmarks with statistical outlier detection.
                </p>

                <div className="grid grid-cols-3 gap-6 pt-2">
                  {[
                    { label: "🦀 Rust WASM", sub: "High-perf analysis" },
                    { label: "📊 Statistical", sub: "Outlier detection" },
                    { label: "⚡ Real-time", sub: "Live metrics" },
                  ].map(({ label, sub }) => (
                    <div
                      key={label}
                      className="border-l-2 border-white/30 pl-4"
                    >
                      <div className="font-heading text-xs uppercase tracking-widest">
                        {label}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5">{sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              <Link to="/password-performance" className="shrink-0">
                <Button
                  variant="neutral"
                  size="lg"
                  className="font-heading text-sm tracking-[0.2em] uppercase px-8 gap-3"
                >
                  Launch
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section>
          <SectionLabel number="03" title="Data" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-4 border-border shadow-shadow bg-secondary-background p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b-2 border-border pb-3">
                <span className="font-heading text-xs tracking-[0.2em] uppercase">
                  Oslo Weather
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-foreground/30">
                  Live
                </span>
              </div>

              {weatherLoading && (
                <p className="text-xs uppercase tracking-widest text-foreground/40 py-8 text-center">
                  Loading...
                </p>
              )}
              {weatherError && (
                <p className="text-main text-xs border-2 border-main p-3 uppercase tracking-wide">
                  {weatherError}
                </p>
              )}
              {weather &&
                !weatherLoading &&
                (() => {
                  const w = getCurrentTodaysWeather();
                  if (!w) return null;
                  const WeatherIcon = getWeatherIcon(w.symbolCode);
                  return (
                    <div className="flex flex-col gap-4 flex-1">
                      <div className="flex items-end gap-3">
                        <WeatherIcon
                          size={20}
                          className="text-main mb-4 shrink-0"
                        />
                        <span className="font-heading text-[5.5rem] leading-none text-main">
                          {w.temperature}
                        </span>
                        <span className="font-heading text-3xl pb-3 text-foreground/30">
                          °C
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: `${w.humidity}%`, label: "Humidity" },
                          { value: `${w.windSpeed} m/s`, label: "Wind" },
                        ].map(({ value, label }) => (
                          <div
                            key={label}
                            className="border-2 border-border p-3 bg-background"
                          >
                            <div className="font-heading text-lg leading-tight">
                              {value}
                            </div>
                            <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 mt-0.5">
                              {label}
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button
                        variant="default"
                        size="sm"
                        onClick={fetchWeather}
                        disabled={weatherLoading}
                        className="w-full text-xs uppercase tracking-widest gap-2 mt-auto"
                      >
                        <RefreshCw
                          size={11}
                          className={weatherLoading ? "animate-spin" : ""}
                        />
                        Refresh
                      </Button>
                    </div>
                  );
                })()}
            </div>

            <div className="border-4 border-border shadow-shadow bg-secondary-background p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b-2 border-border pb-3">
                <span className="font-heading text-xs tracking-[0.2em] uppercase">
                  Daily Fact
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-foreground/30">
                  Random
                </span>
              </div>

              {loading && (
                <p className="text-xs uppercase tracking-widest text-foreground/40 py-8 text-center">
                  Loading...
                </p>
              )}
              {error && (
                <p className="text-main text-xs border-2 border-main p-3 uppercase tracking-wide">
                  {error}
                </p>
              )}
              {fact && !loading && (
                <div className="flex flex-col gap-4 flex-1">
                  <blockquote className="text-sm leading-relaxed italic text-foreground/80 flex-1">
                    "{fact.text}"
                  </blockquote>
                  <div className="flex gap-2 pt-3 border-t-2 border-border mt-auto">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={fetchUselessFact}
                      disabled={loading}
                      className="flex-1 text-xs uppercase tracking-widest gap-2"
                    >
                      <RefreshCw
                        size={11}
                        className={loading ? "animate-spin" : ""}
                      />
                      New
                    </Button>
                    <Button
                      variant="neutral"
                      size="sm"
                      onClick={() => window.open(fact.permalink, "_blank")}
                      className="text-xs uppercase tracking-widest"
                    >
                      Source
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-4 border-border shadow-shadow bg-secondary-background p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b-2 border-border pb-3">
                <span className="font-heading text-xs tracking-[0.2em] uppercase">
                  GitHub
                </span>
                <a
                  href="https://github.com/jonasnico"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] tracking-[0.2em] uppercase text-foreground/30 hover:text-main transition-colors"
                >
                  jonasnico
                </a>
              </div>

              {githubLoading && (
                <p className="text-xs uppercase tracking-widest text-foreground/40 py-8 text-center">
                  Loading...
                </p>
              )}
              {githubError && (
                <p className="text-main text-xs border-2 border-main p-3 uppercase tracking-wide">
                  {githubError}
                </p>
              )}
              {githubActivity.length > 0 && !githubLoading && (
                <div className="flex flex-col gap-2 flex-1">
                  {githubActivity.slice(0, 4).map((event) => {
                    const ActivityIcon = getActivityIcon(event.type);
                    return (
                      <div
                        key={event.id}
                        className="border-2 border-border p-2.5 bg-background flex items-start gap-2.5"
                      >
                        <ActivityIcon
                          size={11}
                          className="text-main mt-0.5 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-heading uppercase tracking-wide leading-snug">
                            {formatActivityDescription(event)}
                          </p>
                          <p className="text-[10px] text-foreground/40 mt-0.5">
                            {formatTimeAgo(event.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={fetchGitHubActivity}
                    disabled={githubLoading}
                    className="w-full text-xs uppercase tracking-widest gap-2 mt-auto"
                  >
                    <RefreshCw
                      size={11}
                      className={githubLoading ? "animate-spin" : ""}
                    />
                    Refresh
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className="border-t-4 border-border pt-6 flex flex-col sm:flex-row justify-between items-start gap-3">
          <span className="font-heading text-xs text-main tracking-[0.3em] uppercase">
            Sources —
          </span>
          <div className="flex flex-col sm:flex-row gap-3 text-[10px] uppercase tracking-[0.2em] text-foreground/30">
            <a
              href="https://uselessfacts.jsph.pl/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-main transition-colors underline underline-offset-4"
            >
              Useless Facts API
            </a>
            <span className="hidden sm:inline text-foreground/20">·</span>
            <a
              href="https://developer.yr.no/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-main transition-colors underline underline-offset-4"
            >
              Yr.no / MET Norway
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;
