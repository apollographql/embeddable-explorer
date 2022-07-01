export const exampleSchema = `"""
The basic book in the graph
"""
type Book implements Product {
  """
  All books can be found by an isbn
  """
  isbn: String!

  """
  The title of the book
  """
  title: String

  """
  The year the book was published
  """
  year: Int

  """
  A simple list of similar books
  """
  similarBooks: [Book]

  """
  Since books are now products, we can also use their upc as a primary id
  """
  upc: String!

  """
  The name of a book is the book's title + year published
  """
  name(delimeter: String = " "): String
  price: Int
  weight: Int
  reviews: [Review]
  reviewList(first: Int = 5, after: Int = 0): ReviewConnection

  """
  relatedReviews for a book use the knowledge of similarBooks from the books
  service to return related reviews that may be of interest to the user
  """
  relatedReviews(first: Int = 5, after: Int = 0): ReviewConnection
}

"""
Information about the brand Ikea
"""
type Ikea {
  """
  Which asile to find an item
  """
  asile: Int
}

"""
Information about the brand Amazon
"""
type Amazon {
  """
  The url of a referrer for a product
  """
  referrer: String
}

"""
A union of all brands represented within the store
"""
union Brand = Ikea | Amazon

enum ProductType {
  LATEST
  TRENDING
}

type PageInfo {
  hasNextPage: Boolean
  hasPreviousPage: Boolean
}

"""
A connection edge for the Product type
"""
type ProductEdge {
  product: Product
}

"""
A connection wrapper for lists of products
"""
type ProductConnection {
  """
  Helpful metadata about the connection
  """
  pageInfo: PageInfo

  """
  List of products returned by the search
  """
  edges: [ProductEdge]
}

"""
The Product type represents all products within the system
"""
interface Product {
  """
  The primary identifier of products in the graph
  """
  upc: String!

  """
  The display name of the product
  """
  name: String

  """
  A simple integer price of the product in US dollars
  """
  price: Int

  """
  How much the product weighs in kg
  """
  weight: Int @deprecated(reason: "Not all product's have a weight")

  """
  A simple list of all reviews for a product
  """
  reviews: [Review]
    @deprecated(
      reason: "The reviews field on product is deprecated to roll over the return type from a simple list to a paginated list. The easiest way to fix your operations is to alias the new field reviewList to review"
    )

  """
  A paginated list of reviews. This field naming is temporary while all clients
  migrate off of the un-paginated version of this field call reviews. To ease this migration,
  alias your usage of reviewList to reviews so that after the roll over is finished, you
  can remove the alias and use the final field name:

    {
      ... on Product {
        reviews: reviewList {
          edges {
            review {
              body
            }
          }
        }
      }
    }
  """
  reviewList(first: Int = 5, after: Int = 0): ReviewConnection
}

"""
The Furniture type represents all products which are items
of furniture.
"""
type Furniture implements Product {
  """
  The modern primary identifier for furniture
  """
  upc: String!

  """
  The SKU field is how furniture was previously stored, and still exists in some legacy systems
  """
  sku: String!
  name: String
  price: Int

  """
  The brand of furniture
  """
  brand: Brand
  weight: Int
  reviews: [Review]
  reviewList(first: Int = 5, after: Int = 0): ReviewConnection
}

"""
The base User in Acephei
"""
type User {
  """
  A globally unique id for the user
  """
  id: ID!

  """
  The users full name as provided
  """
  name: String

  """
  The account username of the user
  """
  username: String

  """
  A list of all reviews by the user
  """
  reviews: [Review]
}

"""
A review is any feedback about products across the graph
"""
type Review {
  id: ID!

  """
  The plain text version of the review
  """
  body: String

  """
  The user who authored the review
  """
  author: User

  """
  The product which this review is about
  """
  product: Product
}

"""
A connection edge for the Review type
"""
type ReviewEdge {
  review: Review
}

"""
A connection wrapper for lists of reviews
"""
type ReviewConnection {
  """
  Helpful metadata about the connection
  """
  pageInfo: PageInfo

  """
  List of reviews returned by the search
  """
  edges: [ReviewEdge]
}

type Query {
  """
  Fetch a simple list of products with an offset
  """
  topProducts(first: Int = 5): [Product]
    @deprecated(reason: "Use products instead")

  """
  Fetch a paginated list of products based on a filter type.
  """
  products(first: Int = 5, after: Int = 0, type: ProductType): ProductConnection

  """
  The currently authenticated user root. All nodes off of this
  root will be authenticated as the current user
  """
  me: User
}`;
