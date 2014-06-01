---
layout: default
title: UITableView 快速滑动和简化控制器 ——《iOS 6编程实战》读书笔记(3)
---

<h2>{{ page.title}}</h2>



***
### 1、提高UITableView的滚动速度


提高UITableView滚动速度的要点就是：每个Cell只使用一个Custom View，而这个View所有的内容都通过重写drawRect方法直接画上去。这是因为GPU渲染时，透明的混合图层会非常耗费资源。而drawRect是在做预渲染的工作。

可以使用Instruments中的Core Animation来比较有半透明混合图层和没有半透明混合图层的TableView滑动的帧数（勾选Color Blended Layers 可以看到标记会红色的半透明图层，如图）。勾选会发现使用drawRect画上去的tableView滚动帧数更大。

![Color Blended Layers 展示的图片](/assets/images/2013-03-31-Should-Use-IB/iphone_render.png)

Color Blended Layers 展示的图片

相关的阅读：[http://blog.atebits.com/2008/12/fast-scrolling-in-tweetie-with-uitableview](http://blog.atebits.com/2008/12/fast-scrolling-in-tweetie-with-uitableview/) (这个连接貌似打不开了，可以打开：[http://atebits.tumblr.com/post/197580827/fast-scrolling-in-tweetie-with-uitableview](http://atebits.tumblr.com/post/197580827/fast-scrolling-in-tweetie-with-uitableview))

### 2、简化控制器内容

使用UITableView时，遇到处理复杂的非重复表单元，或者是在同一界面需要使用多个UITableView时，假如使用一个控制器（UIViewController）进行控制，就会让控制器代码变得庞大复杂，所以在设计和重构时需要考虑相关问题。处理这些问题的方法主要有两种：

1.**数据绑定:** 即，将不同类型Cell需要展示的数据绑定到不同的子视图Cell上，简化控制器的代码维护工作。如RSS阅读器展示推送信息的FeedCell：
FeedCell中绑定数据的方法：

`
-(void) bindFeed:(Feed*) feedToBeDisplayed {
    self.titleLabel.text = feedToBeDisplayed.text;    
    self.timeStampLabel.text = feedToBeDisplayed.modifiedDateString;
    ...
}`  


这个绑定方法可以可以在Cell的子类里做，也可以使用Category分类类来实现。如需要显示订阅，则使用bindSubscription:(Subscription*)subsription这样的绑定方式。假如使用了UITableViewCell的子类，需要显示更不同的Feed类，如TechFeed，可以用protocol定义接口来进行泛绑定：-(void) bindFeed:(id)feed，以便子类继承重载。

2.使用多个UITableView时，注意将每个UITableView使用独立的控制器来管理对应的委托（delegate）和数据源（datasource），防止对个UITableView的委托和数据源混合。

PS:控制器应该在模型与UI元素（在当前层定义的，而不是在子类层级定义的）之间扮演中介的角色。即UIViewController可以设置当前作用域内定义的的UI元素属性，而不要对子视图这样做。如
<code>self.textLabel.text = NSLocalizedString(@"Hello", @"")</code> 是正确的代码，而<code>self.customView.textLabel.text = NSLocalizedString(@"Hello", @"")</code>则推荐使用绑定来实现。]]>
<p>{{ page.date | date_to_string}}</p>
