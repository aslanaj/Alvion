new ResizeObserver(()=>parent.postMessage({type:"alvion-wrap-height",height:document.documentElement.scrollHeight},"*")).observe(document.body);
