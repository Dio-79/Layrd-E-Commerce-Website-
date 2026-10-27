import { Suspense } from "react";
import SearchResults from "./Searchresults";

// useSearchParams() needs a Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResults />
    </Suspense>
  );
}