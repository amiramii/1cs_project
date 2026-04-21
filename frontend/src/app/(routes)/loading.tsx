import { BookshelfLoader } from "@/app/_components/BookshelfLoader"

/** Route-group loading: bookshelf shows immediately while (routes) segments resolve. */
export default function RoutesLoading() {
  return <BookshelfLoader />
}
