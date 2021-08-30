// Helpers
function getColorSources(styles) {
  return styles.filter(style => style.name.startsWith('Source/'))
}

function getColorReceivers(styles) {
  return styles.filter(style => !style.name.startsWith('Source/'))
}

function getReceiverSourcePairs(colorReceivers, colorSources) {
  return colorReceivers.map((style) => ({
    receiver: style,
    source: getSourceForStyle(style, colorSources),
  }));
}

function getSourceForStyle(style, colorSources) {
  for (const currentStyle of colorSources) {
    if (style.description === currentStyle.name) return currentStyle;
  }
  return null;
}

// Main plugin code
figma.showUI(__html__, {width: 400});

const styles = figma.getLocalPaintStyles()
const colorSources = getColorSources(styles)
const colorReceivers = getColorReceivers(styles)
const receiverSourcePairs = getReceiverSourcePairs(colorReceivers, colorSources);
const receiverSourceData = receiverSourcePairs.map((pair) => ({
  receiver: {
    name: pair.receiver.name,
    id: pair.receiver.id,
    paints: pair.receiver.paints,
    description: pair.receiver.description
  },
  source: {
    name: pair.source ? pair.source.name : "",
  },
}));

const colorSourcesData = colorSources.map((pair) => ({
  name: pair.name,
  id: pair.id,
  paints: pair.paints
}));

receiverSourcePairs.forEach((pair) => {
  if (pair.source) {
    pair.receiver.paints = pair.source.paints;
  }
});

figma.ui.postMessage({
  type: "render",
  receiverSourceData,
  colorSourcesData,
});

// Handle message from UI
figma.ui.onmessage = (msg) => {
  if (msg.type == "update-source") {
    const receiverStyle = figma.getStyleById(msg.receiverId) as PaintStyle;
    const sourceStyle = styles.find(
      (style) => style.name === msg.newSourceName
    );
    if (!(receiverStyle && sourceStyle)) return;

    receiverStyle.description = msg.newSourceName;
    receiverStyle.paints = sourceStyle.paints;

    figma.notify(`New source style: ${msg.newSourceName.replace('Source/',"")}`);
  }
};