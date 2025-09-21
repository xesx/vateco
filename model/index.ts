import * as clip from './clip.model.json'
import * as flux from './flux.model.json'
import * as sd15 from './sd15.checkpoint.model.json'

export default {
  ...clip,
  ...flux,
  ...sd15,
}