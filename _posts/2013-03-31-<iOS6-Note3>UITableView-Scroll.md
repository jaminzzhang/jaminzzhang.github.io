---
layout: default
title: 是否使用Interface Builder
---

<h2>{{ page.title}}</h2>

<p>在《iOS6 编程实战》，“第6章 熟练使用表视图” 一章中对是否使用Interface Builder做了讨论(p76)

首先要确认的概念是：IB不是一个代码生成器，而是能将视图生成为基于XML格式归档文件的编辑器。大部分情况，nib文件不会比等效编码生成的UI性能更低。使用IB的优点：
<ol>
	<li><span style="line-height: 14px;">nib文件可以将“视图”独立成单个文件，并且方便直观地管理。</span></li>
	<li>直观的界面展示，方便代码与设计分离。</li>
	<li>适合新手学习。</li>
</ol>
撇开性能上面的考虑，个人并不推荐有经验的程序员使用Interface Builder，原因是：
<ol>
	<li><span style="line-height: 14px;">手动编码同样可以将某个视图进行抽象独立，以便管理；</span></li>
	<li>相比于在IB去做各种属性和frame的手动调整，分层良好的代码会更加清晰。特别是需要对不同rotation调整界面的时候。</li>
	<li>使用IB不利于泛化复用。比如需要对某个控件进行继承以实现新功能时，IB明显没办法做到。</li>
	<li>方便修改，如某个button需要更换或添加controlEvent触发事件时，需要同时修改代码和nib文件，而手动编码的话，只需要修改一个.m文件。</li>
	<li>还没想好</li>
</ol>
以上只是个人的一些经验之谈，假如有不对的地方，请不吝指正。
</p>
<p>{{ page.date | date_to_string}}</p>
