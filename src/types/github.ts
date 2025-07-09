export interface GitHubEvent {
  id: string;
  type: string;
  repo: {
    name: string;
    url: string;
  };
  payload: {
    ref?: string;
    commits?: Array<{
      message: string;
    }>;
    action?: string;
    pull_request?: {
      title: string;
      html_url: string;
    };
    issue?: {
      title: string;
      html_url: string;
    };
  };
  created_at: string;
}
