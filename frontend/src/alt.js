!(function (e, t, n) {
  var d = 'createElement',
    m = 'getElementsByTagName',
    c = 'setAttribute',
    n = document.getElementById(e);
  return (
    n && n.parentNode && n.parentNode.removeChild(n),
    (n = document[d + 'NS'] && document.documentElement.namespaceURI),
    (n = n ? document[d + 'NS'](n, 'script') : document[d]('script')),
    n[c]('id', e),
    n[c]('src', t),
    (document[m]('head')[0] || document[m]('body')[0]).appendChild(n),
    (n = new Image()),
    void n[c]('src', 'https://d1uo4w7k31k5mn.cloudfront.net/donut/0.png')
  );
})(
  'altmetric-embed-js',
  'https://d1bxh8uas1mnw7.cloudfront.net/assets/embed.js',
);
