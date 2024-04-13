const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(
  cors({
    origin: "*",
  })
);
let allPosts = [];

// Handler for HTTP requests
app.get("/", async (req, res) => {
  try {
    // Dynamically import node-fetch
    const fetch = await import("node-fetch");

    // Sample implementation of getPosts function
    const getPosts = async (username, from) => {
      let res = await fetch.default("https://medium.com/_/graphql", {
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify([
          {
            variables: {
              homepagePostsFrom: from,
              includeDistributedResponses: true,
              id: null,
              username,
              homepagePostsLimit: 25,
            },
            query: `query ProfilePubHandlerQuery($id: ID, $username: ID, $homepagePostsLimit: PaginationLimit, $homepagePostsFrom: String, $includeDistributedResponses: Boolean) {
        userResult(id: $id, username: $username) {
          ... on User {
            id
            name
            username
            
            bio
            ...ProfilePubScreen_user
          }
        }
      }
      
      fragment ProfilePubScreen_user on User {
        id
        ...PublisherHomepagePosts_publisher
      }
      
      fragment PublisherHomepagePosts_publisher on Publisher {
        id
        homepagePostsConnection(paging: {limit: $homepagePostsLimit, from: $homepagePostsFrom}, includeDistributedResponses: $includeDistributedResponses) {
          posts {
            ...PublisherHomepagePosts_post
          }
          pagingInfo {
            next {
              ...PublisherHomepagePosts_pagingInfo
            }
          }
        }
      }
      
      fragment PublisherHomepagePosts_post on Post {
          ...TruncatedPostCard_post
      }
      
      fragment PublisherHomepagePosts_pagingInfo on PageParams {
        from
        limit
      }
      
      fragment TruncatedPostCard_post on Post {
        mediumUrl
        firstPublishedAt
        readingTime
        title
        extendedPreviewContent {
          subtitle
        }
        previewImage {
          id
        }
        previewContent {
            subtitle
        }
      }`,
          },
        ]),
        method: "POST",
      });
      const [{ data }] = await res.json();
      return data;
    };

    // Sample implementation of getAllPosts function
    const getAllPosts = async (username, nextToken = null) => {
      let data = await getPosts(username, nextToken);
      data.userResult.homepagePostsConnection.posts.forEach((element) => {
        allPosts.push(element);
      });
      console.log(data.userResult.homepagePostsConnection.pagingInfo);
      if (!data.userResult.homepagePostsConnection.pagingInfo.next) {
        return allPosts;
      }
      let foundNexttoken =
        data.userResult.homepagePostsConnection.pagingInfo.next.from;
      if (!foundNexttoken) {
        return allPosts;
      }
      return getAllPosts(username, foundNexttoken);
    };

    let returnposts = [];
    if (allPosts.length > 0) {
      returnposts = allPosts; // caching
    } else {
      returnposts = await getAllPosts("baytaltanmeya.bt"); // USE YOUR USERNAME HERE
    }

    res.status(200).json(returnposts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
