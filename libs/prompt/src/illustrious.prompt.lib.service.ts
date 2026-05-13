import { Injectable } from '@nestjs/common'
// import { ConfigService } from '@nestjs/config'

const data = {
  "style": [
    "anime", "comics", "vector", "western", "digital painting", "oil painting", "watercolor",
    "acrylic painting", "gouache painting", "pastel painting",
    "concept art",
    "fantasy illustration", "dark",
    "storybook illustration", "children's book illustration",
    "art nouveau", "art deco", "renaissance painting", "baroque painting",
    "romanticism", "impressionism", "realistic painting", "semi-realistic painting",
    "studio ghibli", "disney animation", "pixar",
    "comic", "graphic novel style", "ink", "pen and ink",
    "sketch style", "line art with color",
    "ethereal painting", "surreal painting"
  ],
  "subject": [
    "1girl", "1boy", "2girls", "beautiful girl", "handsome boy", "young woman", "cute girl", "elegant lady", "mature woman", "beautiful female", "1girl solo", "female focus", "male focus", "1girl and 1boy", "beautiful princess", "sorceress", "samurai girl", "idol", "office lady", "schoolgirl", "nurse", "succubus", "angel girl", "catgirl", "elf girl"
  ],
  "important_feature": [
    "long hair", "short hair", "pink hair", "silver hair", "white hair", "black hair", "blonde hair", "red hair", "purple hair", "blue eyes", "red eyes", "green eyes", "golden eyes", "heterochromia", "large breasts", "medium breasts", "small breasts", "slender body", "curvy figure", "petite body", "cat ears", "fox ears", "demon horns", "angel wings", "glasses", "tattoos", "freckles", "pointed ears", "ahoge"
  ],
  "more_details": [
    "detailed face", "sharp eyes", "beautiful detailed eyes", "long eyelashes", "perfect anatomy", "intricate clothing", "fabric details", "hair ornament", "jewelry", "stockings", "thighhighs", "lace", "translucent fabric", "wet skin", "sweat", "blush"
  ],
  "pose": [
    "standing", "sitting", "lying on back", "lying on side", "kneeling", "leaning forward", "leaning against wall", "looking at viewer", "looking back", "dynamic pose", "arms up", "hands on hips", "crossed legs", "peace sign", "bent over", "squatting", "floating", "hand on chest", "hand between legs"
  ],
  "action": [
    "holding sword", "casting magic", "blowing kiss", "playing with hair", "adjusting clothes", "holding flower", "eating", "drinking", "reading", "dancing", "fighting pose", "hugging pillow", "stretching", "waving", "pointing"
  ],
  "framing": [
    "upper body", "medium shot", "full body", "close-up", "extreme close-up", "wide shot", "portrait", "cowboy shot", "dynamic angle", "from below", "from above", "three-quarter view", "side view"
  ],
  "setting": [
    "bedroom", "luxurious bedroom", "enchanted forest", "cyberpunk city", "fantasy castle", "sakura garden", "beach at sunset", "modern apartment", "traditional japanese room", "throne room", "cafe", "library", "rooftop", "mountain temple", "underwater palace"
  ],
  "background": [
    "detailed background", "beautiful scenery", "city lights", "neon signs", "sakura petals falling", "foggy atmosphere", "magical particles", "depth of field", "bokeh", "intricate background", "starry sky", "rain", "cherry blossoms", "ancient ruins", "floating lanterns", "glowing flowers"
  ],
  "lighting": [
    "soft lighting", "dramatic lighting", "volumetric lighting", "golden hour", "neon lighting", "cinematic lighting", "rim lighting", "backlighting", "god rays", "warm lighting", "cool moonlight", "candlelight", "harsh shadows", "soft glow"
  ],
  "camera_angle": [
    "eye level", "low angle", "high angle", "dutch angle", "over the shoulder", "worm's eye view", "bird's eye view", "extreme perspective", "symmetrical composition", "dynamic camera angle"
  ],
  "quality_tags": [
    "masterpiece",
    "best quality",
    "very aesthetic",
    "absurdres",
    "highres",
    "ultra-detailed",
    "intricate details",
    "sharp focus",
    "4k",
    "8k",
    "beautiful",
    "highly detailed",
    "expression"
  ],

  "clothing": [
    "beautiful dress", "maid outfit", "school uniform", "kimono", "office suit", "crop top", "short skirt", "thighhighs", "stockings", "lace lingerie", "bikini", "hoodie", "sweater", "jacket", "armor", "battle dress", "casual clothes", "evening gown", "traditional clothing", "naked", "partially undressed", "wet clothes"
  ],
  "expression": [
    "gentle smile", "seductive smile", "happy smile", "shy smile", "smug smile", "blush", "looking at viewer", "looking away", "teary eyes", "ahegao", "closed eyes", "winking", "pout", "surprised", "angry", "calm", "playful expression"
  ],

  "mood": [
    "serene", "romantic", "mysterious", "seductive", "peaceful", "melancholic", "energetic", "dark", "dreamy", "ethereal", "intimate", "dramatic", "wholesome", "elegant", "powerful"
  ],
  "color_palette": [
    "vibrant colors", "pastel colors", "dark tones", "warm color palette", "cool color palette", "neon color scheme", "monochrome", "high contrast", "soft pastel", "rich saturated colors"
  ]
}


@Injectable()
export class IllustriousPromptLibService {
  constructor() {}
}