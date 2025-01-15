module.exports = (ctx) => {
  const register = () => {
    ctx.helper.uploader.register('imgurl-uploader', {
      handle,
      name: 'imgurl',
      config: config
    })
  }
  const handle = async function (ctx) {
    let userConfig = ctx.getConfig('picBed.imgurl-uploader')
    if (!userConfig) {
      throw new Error('Can\'t find uploader config')
    }
    const uid = userConfig.uid
    const token = userConfig.token
    const album_id = userConfig.album_id
    const uploadUrl = 'https://www.imgurl.org/api/v2/upload'
    try {
      let imgList = ctx.output
      for (let i in imgList) {
        let image = imgList[i].buffer
        if (!image && imgList[i].base64Image) {
          image = Buffer.from(imgList[i].base64Image, 'base64')
        }
        const postConfig = postOptions(image, uploadUrl, uid, token, album_id, imgList[i].fileName)
        let body = await ctx.Request.request(postConfig)

        delete imgList[i].base64Image
        delete imgList[i].buffer
        let imgUrl = JSON.parse(body).data.url
        if (imgUrl) {
          imgList[i]['imgUrl'] = imgUrl
        } else {
          ctx.emit('notification', {
            title: '返回解析失败',
            body: body
          })
        }
      }
    } catch (err) {
      ctx.emit('notification', {
        title: '上传失败',
        body: JSON.stringify(err)
      })
    }
  }

  const postOptions = (image, uploadUrl, uid, token, album_id, fileName) => {
    let headers = {
      contentType: 'multipart/form-data',
      'User-Agent': 'PicGo'
    }
    let formData = {}
    const opts = {
      method: 'POST',
      url: uploadUrl,
      headers: headers,
      formData: formData
    }

    opts.formData['file'] = {}
    opts.formData['file'].value = image
    opts.formData['file'].options = {
      filename: fileName
    }

    opts.formData['uid'] = uid
    opts.formData['token'] = token
    if (album_id) {
      opts.formData['album_id'] = album_id
    }

    return opts
  }

  const config = ctx => {
    let userConfig = ctx.getConfig('picBed.imgurl-uploader')
    if (!userConfig) {
      userConfig = {}
    }
    return [
      {
        name: 'uid',
        type: 'input',
        default: userConfig.uid,
        required: true,
        message: 'UID, 通过ImgURL后台获取',
        alias: 'UID'
      },
      {
        name: 'token',
        type: 'input',
        default: userConfig.token,
        required: true,
        message: 'Token, 通过ImgURL后台获取',
        alias: 'Token'
      },
      {
        name: 'album_id',
        type: 'input',
        default: userConfig.album_id,
        required: false,
        message: '相册ID',
        alias: 'album_id'
      }
    ]
  }
  return {
    uploader: 'imgurl-uploader',
    register
  }
}
