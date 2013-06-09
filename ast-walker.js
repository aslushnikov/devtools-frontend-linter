/**
 * A simple tree walker
 */
function walk(nodes, visitor) {
    if (Array.isArray(nodes)) {
        for(var i = 0; i < nodes.length; ++i) {
            walkNode(nodes[i], visitor);
        }
    } else
        walkNode(nodes, visitor);
}

function walkNode(node, visitor) {
    if (visitor(node))
        return;
    for(var child in node) {
        if (typeof node[child] === "object") {
            var c = node[child];
            if (c !== null) walkNode(c, visitor);
        }
    }
}

/**
 * @return {null|Array.<string>}
 */
function flattenStaticMemberExpression(node) {
    var tokens = [];
    while (node) {
        if (node.type === "MemberExpression") {
            if (node.property.type !== "Identifier" || node.computed === true)
                return null;
            tokens.push(node.property.name);
            node = node.object;
        } else if (node.type === "Identifier") {
            tokens.push(node.name);
            break;
        } else {
            return null;
        }
    }
    return tokens.reverse();
}

/**
 * exports to public API
 */
exports.walk = walk;
exports.flattenStaticMemberExpression = flattenStaticMemberExpression;

