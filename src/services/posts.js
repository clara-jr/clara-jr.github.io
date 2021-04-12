const endpoint = "https://4zsmzv3ooi.execute-api.eu-west-1.amazonaws.com/dev";
const secretKey = "3dZcHE1HxLD6SccATNNxFuTbwDH36sXOV5b2xM3bJ45QvmqnuXxhELVDHCpUl5L35PYtkaN3mvdmCqxE370cv2hOxmJr1UJK8aN8";

const getPosts = (lastEvaluatedKey, next) => {
  const url = next ? `${endpoint}/${next}` : endpoint;
  return fetch(url, { headers: { 'Content-Type': 'application/json', 'authorisation': secretKey, 'Body': JSON.stringify(lastEvaluatedKey) || '{}' } })
    .then(result => result.json())
    .then(resultJSON => {
      console.log(resultJSON)
      return resultJSON
    })
}

const getPost = (id) => {
  let url = `${endpoint}/blog/${id}`;
  return fetch(url, { headers: { 'authorisation': secretKey } })
    .then(result => result.json())
    .then(resultJSON => {
      const { post } = resultJSON
      return post
    })
}

const getImage = (image) => {
  if (image && image !== '') return `https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/${image}`;
  else return 'https://pbs.twimg.com/profile_images/796757169915969536/8YVxmvQf_400x400.jpg';
}

export {
  getPosts,
  getPost,
  getImage
}