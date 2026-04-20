import "./bookshelf-loading.css"

/**
 * Global route loading: bookshelf animation, theme background, centered.
 */
export default function Loading() {
  return (
    <div
      className="bookshelf-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="bookshelf_wrapper">
        <ul className="books_list">
          <li className="book_item first" />
          <li className="book_item second" />
          <li className="book_item third" />
          <li className="book_item fourth" />
          <li className="book_item fifth" />
          <li className="book_item sixth" />
        </ul>
        <div className="shelf " />
      </div>
    </div>
  )
}
