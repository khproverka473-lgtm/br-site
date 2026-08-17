exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const tiktokUrl = event.queryStringParameters && event.queryStringParameters.url;

    if (!tiktokUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Не передана ссылка на видео' })
      };
    }

    const apiUrl = 'https://www.tikwm.com/api/?url=' + encodeURIComponent(tiktokUrl) + '&hd=1';

    const apiRes = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BR-Downloader/1.0)' }
    });

    if (!apiRes.ok) {
      throw new Error('Сервис загрузки временно недоступен');
    }

    const json = await apiRes.json();

    if (json.code !== 0 || !json.data) {
      throw new Error('Не удалось найти видео по этой ссылке');
    }

    const data = json.data;

    const rawVideo = data.hdplay || data.play;
    const rawThumb = data.cover || data.origin_cover;

    const toAbsolute = (u) => {
      if (!u) return null;
      return u.startsWith('http') ? u : 'https://www.tikwm.com' + u;
    };

    const videoUrl = toAbsolute(rawVideo);
    const thumbnail = toAbsolute(rawThumb);

    if (!videoUrl) {
      throw new Error('Видео не найдено или ссылка недействительна');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        videoUrl: videoUrl,
        thumbnail: thumbnail,
        title: data.title || ''
      })
    };

  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: false, error: err.message || 'Ошибка обработки видео' })
    };
  }
};
