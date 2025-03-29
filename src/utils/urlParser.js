export const parseRedditUrl = (url) => {
    const regex = /reddit\.com\/r\/([^/]+)\/comments\/([^/]+)/;
    const match = url.match(regex);
    if (!match) throw new Error('Invalid Reddit URL');
    return { subreddit: match[1], postId: match[2] };
  };