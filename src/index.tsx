import { ActionPanel, Action, List, Icon } from "@raycast/api";
import { useFetch, Response } from "@raycast/utils";
import { useState } from "react";
import { URLSearchParams } from "node:url";

const ALGOLIA_HOST = "https://p6vyurbgg0-dsn.algolia.net";
const ALGOLIA_API_KEY = "ZWJlNzYwNjdkZThjMWFhODBkMjk5NjU2YzQ1MzVjMDNmNzAwMTAxM2JmYjNkMDE3YzJiODg0YWFkMmJhNjg5Y2ZpbHRlcnM9ZG9tYWluJTNBbGF1bmNoZGFya2x5LmNvbSUyMEFORCUyMGF1dGhlZCUzQWZhbHNlJTIwQU5EJTIwTk9UJTIwdHlwZSUzQW5hdmlnYXRpb24mcmVzdHJpY3RJbmRpY2VzPWZlcm5fZG9jc19zZWFyY2gmdmFsaWRVbnRpbD0xNzQwNjY4OTAy";

const ANGOLIA_URL = `${ALGOLIA_HOST}/1/indexes/*/queries?`;
type FacetTypeFitler = "type:api-reference" | "type:markdown" | "version.title:LaunchDarkly docs" 

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [isShowingDetail, setIsShowingDetail] = useState(false);
  const [selectedTab, setSelectedTab] = useState<FacetTypeFitler | null>(null);
  const toggleDetail = () => setIsShowingDetail(!isShowingDetail);
  
  
  const { data, isLoading, revalidate } = useFetch(
    ANGOLIA_URL,
    {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "text/plain",
        "x-algolia-agent": "Algolia for JavaScript (5.13.0); Lite (5.13.0); Browser; instantsearch.js (4.75.4); react (18.3.1); react-instantsearch (7.13.7); react-instantsearch-core (7.13.7); next.js (14.2.9-fork.2); JS Helper (3.22.5)",
        "x-algolia-application-id": "P6VYURBGG0",
        "x-algolia-api-key": ALGOLIA_API_KEY,
      },
      body: JSON.stringify({
        requests: [
          {
            indexName: "fern_docs_search",
            analytics: true,
            analyticsTags: ["mac", "desktop", "launchdarkly.com", "search-v2-dialog"],
            attributesToSnippet: ["description:32", "content:32"],
            decompoundQuery: true,
            distinct: true,
            enableRules: true,
            facetFilters: selectedTab ? [selectedTab] : [],
            facetingAfterDistinct: true,
            highlightPostTag: "__/ais-highlight__",
            highlightPreTag: "__ais-highlight__",
            ignorePlurals: true,
            maxValuesPerFacet: 1000,
            query: searchText,
            restrictHighlightAndSnippetArrays: true,
            userToken: "anonymous-raycast-user",
          },
        ],
      }),
      parseResponse: parseFetchResponse,
      keepPreviousData: true,
    }
  );

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      isShowingDetail={isShowingDetail}
      searchBarPlaceholder="Searching LaunchDarkly documentation..."
      throttle
      navigationTitle="Search LaunchDarkly Docs"
      searchBarAccessory={
        <List.Dropdown
          tooltip="Select Documentation Section"
          storeValue={true}
          onChange={setSelectedTab}
        >
          <List.Dropdown.Item title="All Sections" value="All" />
          <List.Dropdown.Item title="Guides" value="Guides" />
          <List.Dropdown.Item title="API Docs" value="API Docs" />
          <List.Dropdown.Item title="SDKs" value="SDKs" />
        </List.Dropdown>
      }
    >
      {data?.length === 0 && searchText !== "" ? (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="No Results Found"
          description="Try adjusting your search terms or selecting a different section"
        />
      ) : (
        <List.Section title="Results" subtitle={data?.length + ""}>
          {data?.map((searchResult) => (
            <SearchListItem 
              key={searchResult.url}  
              searchResult={searchResult}
              toggleDetail={toggleDetail}
              isShowingDetail={isShowingDetail}
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}

function SearchListItem({ searchResult, toggleDetail, isShowingDetail }: { 
  searchResult: SearchResult;
  toggleDetail: () => void;
  isShowingDetail: boolean;
}) {
  // Helper function to clean highlight markers from Algolia and convert to plain text
  const removeHighlight = (text?: string) => {
    if (!text) return '';
    return text
      .replace(/__ais-highlight__/g, '')
      .replace(/__\/ais-highlight__/g, '');
  };
  const cleanHighlight = (text?: string) => {
    if (!text) return '';
    return text
      .replace(/__ais-highlight__/g, '**')
      .replace(/__\/ais-highlight__/g, '**');
  };
  const [_, iconKey] = searchResult.icon?.split(" ") ?? [];
  const hasHighlightedDescription = !!searchResult.highlightedDescription;
  type TabTitle = "Guides" | "API Docs" | "SDKs" | "default";
  const tabIconMap: Record<TabTitle, string> = {
    "Guides": "book-outline",
    "API Docs": "book-code",
    "SDKs": "book-code",
    "default": "book-outline"
  };
  const chosenIcon = iconKey ?? tabIconMap[searchResult.tab?.title as TabTitle ?? "default"] ?? "book-outline";
  return (
    <List.Item
      key={searchResult.id}
      title={searchResult.name}
      icon={ chosenIcon ? { source: `icons/lp-icon-${chosenIcon}.svg` } : undefined }
      subtitle={searchResult.breadcrumb}
      accessories={[
        { text: searchResult?.tab?.title ?? "" }
      ]}
      detail={
        <List.Item.Detail
          markdown={`# ${searchResult.name}
\n\n${cleanHighlight(searchResult.contentSnippet || searchResult.highlightedDescription || searchResult.highlightedDescription || searchResult.description)}
`}
        />
      }
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.OpenInBrowser title="Open in Browser" url={searchResult.url} />
            <Action 
              icon={Icon.Paragraph}              
              title={isShowingDetail ? "Hide Detail View" : "Show Detail View"}
              shortcut={{ modifiers: ["cmd"], key: "y" }}
              onAction={toggleDetail}
            />
            {searchResult.contentSnippet?.includes('```') && (
              <Action.CopyToClipboard
                title="Copy Code Block"
                content={extractCodeBlock(searchResult.contentSnippet)}
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              />
            )}
            <Action.CopyToClipboard
              title="Copy URL"
              content={searchResult.url}
              shortcut={{ modifiers: ["cmd"], key: "." }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function extractCodeBlock(content: string): string {
  const codeBlockMatch = content.match(/```[\s\S]*?```/);
  return codeBlockMatch ? codeBlockMatch[0].replace(/```/g, '').trim() : '';
}

interface AlgoliaHit {
  title: string;
  pathname: string;
  description: string;
  domain: string;
  canonicalPathname: string;
  breadcrumb: Array<{
    title: string;
    pathname: string;
  }>;
  version: {
    id: string;
    title: string;
    pathname: string;
  };
  tab: {
    title: string;
    pathname: string;
  };
  page_position: number;
  type: string;
  objectID: string;
  _snippetResult: {
    description: {
      value: string;
      matchLevel: string;
    };
    content?: {
      value: string;
      matchLevel: string;
    };
  };
  _highlightResult: {
    title: {
      value: string;
      matchLevel: string;
      matchedWords: string[];
    };
    description: {
      value: string;
      matchLevel: string;
      matchedWords: string[];
    };
    content?: {
      value: string;
      matchLevel: string;
      matchedWords: string[];
    };
  };
  icon?: string;
  content?: string;
}

interface AlgoliaResponse {
  results: Array<{
    hits: AlgoliaHit[];
    nbHits: number;
    page: number;
    nbPages: number;
    hitsPerPage: number;
    exhaustiveNbHits: boolean;
    exhaustiveTypo: boolean;
    exhaustive: {
      nbHits: boolean;
      typo: boolean;
    };
    query: string;
    params: string;
    index: string;
    queryID: string;
    processingTimeMS: number;
    processingTimingsMS: {
      _request: {
        roundTrip: number;
      };
      fetch?: {
        query: number;
        total: number;
      };
      afterFetch?: {
        format: {
          total: number;
        };
      };
      total: number;
    };
    serverTimeMS: number;
    _automaticInsights?: boolean;
    renderingContent?: Record<string, unknown>;
  }>;
}

async function parseFetchResponse(response: Response) {
  const json = (await response.json()) as AlgoliaResponse;
  if (!response.ok || "message" in json) {
    throw new Error("message" in json ? (json as {message: string}).message : response.statusText);
  }

  return json.results
    .flatMap((result) => result.hits)
    .map(({ 
      title, 
      pathname, 
      description, 
      objectID, 
      type, 
      version, 
      breadcrumb,
      _highlightResult,
      _snippetResult,
      tab,
      icon,
      content
    }) => ({
      name: title,
      description,
      path: pathname,
      url: `https://docs.launchdarkly.com${pathname}`,
      id: objectID,
      type: type || "Page",
      version: version.title,
      icon: icon,
      tab: tab,
      breadcrumb: breadcrumb.map(b => b.title).join(" > "),
      // Add highlighted versions of content
      highlightedTitle: _highlightResult?.title?.value,
      highlightedDescription: _highlightResult?.description?.value,
      // Include content snippet if available
      contentSnippet: _snippetResult?.content?.value || _snippetResult?.description?.value
    }));
}

interface SearchResult {
  name: string;
  id: string;
  description?: string;
  url: string;
  path: string;
  type: string;
  version: string;
  breadcrumb: string;
  icon?: string;
  tab: {
    title: string;
    pathname: string;
  };
  // Add new fields for highlighted content
  highlightedTitle?: string;
  highlightedDescription?: string;
  contentSnippet?: string;
}
