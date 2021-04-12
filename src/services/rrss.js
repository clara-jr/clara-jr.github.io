const _socialWindow = (url) => {
  const left = (window.screen.width - 570) / 2
  const top = (window.screen.height - 570) / 2
  const params = 'menubar=no,toolbar=no,status=no,width=570,height=570,top=' + top + ',left=' + left
  window.open(url, 'NewWindow', params)
}

const setShareLinks = (rrss, title) => {
  const pageUrl = encodeURIComponent(document.URL)
  let url = ''
  let tweet = title.split('<emoji>')[0].split(' ')
  tweet = tweet.filter(val => val !== '' && val !== '\n')
  tweet = tweet.join(' ')
  switch (rrss) {
    case 'whatsapp':
      url = 'https://api.whatsapp.com/send?text=' + tweet + '%20' + pageUrl
      _socialWindow(url)
      break
    case 'facebook':
      url = 'https://www.facebook.com/sharer.php?u=' + pageUrl + '&quote=' + tweet
      _socialWindow(url)
      break
    case 'twitter':
      url = 'https://twitter.com/intent/tweet?url=' + pageUrl + '&text=' + tweet
      _socialWindow(url)
      break
    default:
      break
  }
}

export {
  setShareLinks
}
