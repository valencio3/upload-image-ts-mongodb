import { Router } from 'express'
import { unlinkSync, existsSync, mkdirSync } from 'fs'
import * as sharp from 'sharp'
import { basename, join } from 'path'

import {
  ArquivoController,
  ErroDownload
} from '../controllers/ArquivoController'

export const thumbnailRouter = Router()

thumbnailRouter.get('/:id', async (req, res) => {
  const { id } = req.params
  const { bd } = req.app.locals
  const arquivoCtrl = new ArquivoController(bd)

  try {
    const caminhoArquivo = await arquivoCtrl.realizarDownload(id)
    const thumbnail = join(
      __dirname,
      '..',
      '..',
      'thumbnail',
      basename(caminhoArquivo)
    )
    if (!existsSync(join(
      __dirname,
      '..',
      '..',
      'thumbnail'))) {
      mkdirSync(join(
        __dirname,
        '..',
        '..',
        'thumbnail'))
    }
    sharp(caminhoArquivo)
      .resize(100, 100, {
        fit: sharp.fit.contain
      })
      .toFile(thumbnail)
      .then(e => {
        return res.download(thumbnail, () => {
          unlinkSync(caminhoArquivo)
          unlinkSync(thumbnail)
        })
      })
  } catch (erro) {
    switch (erro) {
      case ErroDownload.ID_INVALIDO:
        return res.status(400).json({ mensagem: ErroDownload.ID_INVALIDO })
      case ErroDownload.NAO_FOI_POSSIVEL_GRAVAR:
        return res
          .status(500)
          .json({ mensagem: ErroDownload.NAO_FOI_POSSIVEL_GRAVAR })
      case ErroDownload.NENHUM_ARQUIVO_ENCONTRADO:
        return res
          .status(404)
          .json({ mensagem: ErroDownload.NENHUM_ARQUIVO_ENCONTRADO })
      default:
        return res.status(500).json({ mensagem: 'Erro no servidor' })
    }
  }
})
