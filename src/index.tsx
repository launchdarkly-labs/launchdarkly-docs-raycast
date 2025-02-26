import { ActionPanel, Action, List } from "@raycast/api";
import { useFetch, Response } from "@raycast/utils";
import { useState } from "react";
import { URLSearchParams } from "node:url";

const ALGOLIA_HOST = "https://dl2c5qx6xb-dsn.algolia.net";
const ALGOLIA_API_KEY = "9a89b2831ea7014e98ec4a0f477d2de5";

const ANGOLIA_URL = `${ALGOLIA_HOST}/1/indexes/*/queries?`;
export default function Command() {
  const [searchText, setSearchText] = useState("");
  const { data, isLoading } = useFetch(
    ANGOLIA_URL +
      // send the search query to the API
      new URLSearchParams({
        "x-algolia-agent": "Raycast",
        "x-algolia-application-id": "DL2C5QX6XB",
        "x-algolia-api-key": ALGOLIA_API_KEY,
      }),
    {
      method: "POST",
      body: JSON.stringify({
        requests: [
          {
            indexName: "Docs_production",
            params: new URLSearchParams({
              query: searchText,
              facets: "[]",
              tagFilters: "",
            }).toString(),
          },
        ],
      }),
      parseResponse: parseFetchResponse,
    }
  );

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Searching LaunchDarkly documentation..."
      throttle
    >
      <List.Section title="Results" subtitle={data?.length + ""}>
        {data?.map((searchResult) => (
          <SearchListItem key={searchResult.name} searchResult={searchResult} />
        ))}
      </List.Section>
    </List>
  );
}

function SearchListItem({ searchResult }: { searchResult: SearchResult }) {
  return (
    <List.Item
      title={searchResult.name}
      subtitle={searchResult.description}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.OpenInBrowser title="Open in Browser" url={searchResult.url} />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.CopyToClipboard
              title="Copy Url"
              content={`${searchResult.url}`}
              shortcut={{ modifiers: ["cmd"], key: "." }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

/** Parse the response from the fetch query into something we can display */
async function parseFetchResponse(response: Response) {
  const json = (await response.json()) as
    | any
    | { code: string; message: string };

  if (!response.ok || "message" in json) {
    throw new Error("message" in json ? json.message : response.statusText);
  }

  return json.results.map((v: any) => {
    return v.hits;
  }).flat().map(({title, path, description}): SearchResult => {
    return { 
      name: title,
      description: description,
      url: `https://docs.launchdarkly.com${path}`
    } as SearchResult;
  });
}

interface SearchResult {
  name: string;
  description?: string;
  url: string;
}
