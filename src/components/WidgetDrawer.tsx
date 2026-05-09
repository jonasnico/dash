import React, { useState, useEffect } from "react";
import { X, RefreshCw, CloudRain, Sun, Cloud, GitBranch, Star, GitFork } from "lucide-react";
import Button from "@/components/ui/button";
import { fetchOsloWeather } from "@/services/weatherService";
import type { UselessFact, WeatherData, GitHubEvent, CurrentWeather } from "@/types";

interface WidgetDrawerProps {
  open: boolean;
  onClose: () => void;
}

const SectionDivider = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="font-heading text-[10px] text-main tracking-[0.3em] uppercase">{title}</span>
    <div className="flex-1 h-px bg-border opacity-20" />
  </div>
);

const WidgetDrawer: React.FC<WidgetDrawerProps> = ({ open, onClose }) => {
  const [fact, setFact] = useState<UselessFact | null>(null);
  const [factLoading, setFactLoading] = useState(false);
  const [factError, setFactError] = useState<string | null>(null);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const [githubActivity, setGithubActivity] = useState<GitHubEvent[]>([]);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

  const fetchFact = async () => {
    setFactLoading(true);
    setFactError(null);
    try {
      const res = await fetch("https://uselessfacts.jsph.pl/api/v2/facts/random");
      if (!res.ok) throw new Error("Failed to fetch fact");
      setFact(await res.json());
    } catch (err) {
      setFactError(err instanceof Error ? err.message : "Failed to load fact");
    } finally {
      setFactLoading(false);
    }
  };

  const fetchWeather = async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      setWeather(await fetchOsloWeather());
    } catch (err) {
      setWeatherError(err instanceof Error ? err.message : "Failed to load weather");
    } finally {
      setWeatherLoading(false);
    }
  };

  const fetchGithub = async () => {
    setGithubLoading(true);
    setGithubError(null);
    try {
      const res = await fetch("https://api.github.com/users/jonasnico/events/public");
      if (!res.ok) throw new Error("Failed to fetch GitHub activity");
      const events = await res.json();
      setGithubActivity(events.slice(0, 5));
    } catch (err) {
      setGithubError(err instanceof Error ? err.message : "Failed to load GitHub activity");
    } finally {
      setGithubLoading(false);
    }
  };

  useEffect(() => {
    if (open && !fact && !factLoading) fetchFact();
    if (open && !weather && !weatherLoading) fetchWeather();
    if (open && githubActivity.length === 0 && !githubLoading) fetchGithub();
  }, [open]);

  const getCurrentWeather = (): CurrentWeather | null => {
    if (!weather?.properties?.timeseries?.length) return null;
    const current = weather.properties.timeseries[0];
    const withForecast = weather.properties.timeseries.find((e) => e.data.next_6_hours);
    return {
      temperature: Math.round(current.data.instant.details.air_temperature),
      humidity: current.data.instant.details.relative_humidity,
      windSpeed: current.data.instant.details.wind_speed,
      symbolCode: withForecast?.data.next_6_hours?.summary.symbol_code ?? "clearsky_day",
      precipitation: withForecast?.data.next_6_hours?.details.precipitation_amount ?? 0,
    };
  };

  const getWeatherIcon = (symbolCode: string) => {
    if (symbolCode.includes("rain")) return CloudRain;
    if (symbolCode.includes("cloud")) return Cloud;
    return Sun;
  };

  const getActivityIcon = (eventType: string) => {
    if (eventType === "WatchEvent") return Star;
    if (eventType === "ForkEvent") return GitFork;
    return GitBranch;
  };

  const formatActivity = (event: GitHubEvent) => {
    const repo = event.repo.name.split("/")[1];
    switch (event.type) {
      case "PushEvent": {
        const count = event.payload.commits?.length ?? 0;
        return `Pushed ${count} commit${count !== 1 ? "s" : ""} to ${repo}`;
      }
      case "WatchEvent": return `Starred ${repo}`;
      case "ForkEvent": return `Forked ${repo}`;
      case "CreateEvent": return `Created ${event.payload.ref ? "branch" : "repo"} ${repo}`;
      case "PullRequestEvent": return `${event.payload.action} PR in ${repo}`;
      case "IssuesEvent": return `${event.payload.action} issue in ${repo}`;
      default: return `Activity in ${repo}`;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const diffH = Math.floor((Date.now() - new Date(dateString).getTime()) / 3_600_000);
    if (diffH < 1) return "Just now";
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.floor(diffH / 24)}d ago`;
  };

  const currentWeather = getCurrentWeather();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-overlay transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-background border-l-4 border-border overflow-y-auto transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="border-b-4 border-border px-6 py-5 flex items-center justify-between sticky top-0 bg-background z-10">
          <div>
            <p className="font-heading text-[10px] text-main tracking-[0.3em] uppercase">Widgets</p>
            <h2 className="font-heading text-xl leading-tight">THE DASH</h2>
          </div>
          <Button variant="neutral" size="icon" onClick={onClose} aria-label="Close drawer">
            <X size={18} />
          </Button>
        </div>

        <div className="p-6 space-y-8">
          <section>
            <SectionDivider title="Oslo Weather" />
            {weatherLoading && (
              <p className="text-xs uppercase tracking-widest text-foreground/40 py-4 text-center">Loading...</p>
            )}
            {weatherError && (
              <p className="text-main text-xs border-l-4 border-main pl-3">{weatherError}</p>
            )}
            {currentWeather && !weatherLoading && (() => {
              const WeatherIcon = getWeatherIcon(currentWeather.symbolCode);
              return (
                <div className="space-y-3">
                  <div className="flex items-end gap-3">
                    <WeatherIcon size={18} className="text-main mb-3 shrink-0" />
                    <span className="font-heading text-[4.5rem] leading-none text-main">
                      {currentWeather.temperature}
                    </span>
                    <span className="font-heading text-2xl pb-2 text-foreground/30">°C</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: `${currentWeather.humidity}%`, label: "Humidity" },
                      { value: `${currentWeather.windSpeed} m/s`, label: "Wind" },
                    ].map(({ value, label }) => (
                      <div key={label} className="border-2 border-border p-3 bg-secondary-background">
                        <div className="font-heading text-base">{value}</div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">{label}</div>
                      </div>
                    ))}
                  </div>
                  <Button variant="default" size="sm" onClick={fetchWeather} disabled={weatherLoading} className="w-full text-xs uppercase tracking-widest gap-2">
                    <RefreshCw size={11} className={weatherLoading ? "animate-spin" : ""} />
                    Refresh
                  </Button>
                </div>
              );
            })()}
          </section>

          <section>
            <SectionDivider title="Daily Fact" />
            {factLoading && (
              <p className="text-xs uppercase tracking-widest text-foreground/40 py-4 text-center">Loading...</p>
            )}
            {factError && (
              <p className="text-main text-xs border-l-4 border-main pl-3">{factError}</p>
            )}
            {fact && !factLoading && (
              <div className="space-y-4">
                <blockquote className="text-sm leading-relaxed italic text-foreground/80">
                  "{fact.text}"
                </blockquote>
                <div className="flex gap-2 pt-2 border-t-2 border-border">
                  <Button variant="default" size="sm" onClick={fetchFact} disabled={factLoading} className="flex-1 text-xs uppercase tracking-widest gap-2">
                    <RefreshCw size={11} className={factLoading ? "animate-spin" : ""} />
                    New
                  </Button>
                  <Button variant="neutral" size="sm" onClick={() => window.open(fact.permalink, "_blank")} className="text-xs uppercase tracking-widest">
                    Source
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section>
            <SectionDivider title="GitHub" />
            <div className="mb-3 flex justify-between items-center">
              <a
                href="https://github.com/jonasnico"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] tracking-[0.2em] uppercase text-foreground/30 hover:text-main transition-colors"
              >
                jonasnico ↗
              </a>
            </div>
            {githubLoading && (
              <p className="text-xs uppercase tracking-widest text-foreground/40 py-4 text-center">Loading...</p>
            )}
            {githubError && (
              <p className="text-main text-xs border-l-4 border-main pl-3">{githubError}</p>
            )}
            {githubActivity.length > 0 && !githubLoading && (
              <div className="space-y-2">
                {githubActivity.map((event) => {
                  const Icon = getActivityIcon(event.type);
                  return (
                    <div key={event.id} className="border-2 border-border p-2.5 bg-secondary-background flex items-start gap-2.5">
                      <Icon size={11} className="text-main mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-heading uppercase tracking-wide leading-snug">{formatActivity(event)}</p>
                        <p className="text-[10px] text-foreground/40 mt-0.5">{formatTimeAgo(event.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
                <Button variant="default" size="sm" onClick={fetchGithub} disabled={githubLoading} className="w-full text-xs uppercase tracking-widest gap-2 mt-2">
                  <RefreshCw size={11} className={githubLoading ? "animate-spin" : ""} />
                  Refresh
                </Button>
              </div>
            )}
          </section>

          <footer className="border-t-2 border-border pt-4 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.15em] text-foreground/20">
              Facts: <a href="https://uselessfacts.jsph.pl/" target="_blank" rel="noopener noreferrer" className="underline hover:text-main transition-colors">Useless Facts API</a>
            </p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-foreground/20">
              Weather: <a href="https://developer.yr.no/" target="_blank" rel="noopener noreferrer" className="underline hover:text-main transition-colors">Yr.no / MET Norway</a>
            </p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default WidgetDrawer;
