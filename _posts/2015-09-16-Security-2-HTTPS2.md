---
layout: post
title: iOS安全系列之二：HTTPS进阶
category: Security
tags: [HTTPS, iOS]
---

<br/>
上一篇[《iOS安全系列之一：HTTPS》]({% post_url 2014-10-21-Security-1-HTTPS %})被CocoaChina转载，还顺便上了下头条: [打造安全的App！iOS安全系列之 HTTPS](http://www.cocoachina.com/ios/20150810/12947.html)，但那篇文章只是介绍了比较偏应用的初级知识，对于想要深入了解HTTPS的同学来说是远远不够的，刚好本人最近工作上也遇到并解决了一些HTTPS相关的问题，以此为契机，决定写这篇更深入介绍HTTPS的文章。

本文分为以下五节：

1. [中间人攻击](#mitm)：介绍中间人攻击常见方法，并模拟了一个简单的中间人攻击；
2. [校验证书的正确姿势](#verify_safely)：介绍校验证书的一些误区，并讨论了正确校验方式；
3. [ATS](#ats)：讨论下 iOS 9.0 新发布的的特性`App Transport Security`；
4. [调试SSL/TLS](#debug_ssl)：讨论使用Wireshark进行SSL/TLS调试的方法；
5. [后记](#summary)

其中第1节“中间人”是比较常见基础的知识，网上也可以找到相关的资料，如果对中间人攻击已经有了足够的了解，可以跳过。后面几节则是个人在iOS方面的实践总结，除了一些与系统相关的特性外，大部分都是系统无关的通用知识，并且每一章节都比较独立，所以可以直接跳到感兴趣的地方阅读。



<br/><br/>
# <a name="mitm"></a>1. 中间人攻击
关于HTTPS，我经常会提到的就是中间人攻击，那究竟什么是中间人攻击呢？中间人攻击，即所谓的[Main-in-the-middle attack(MITM)](https://en.wikipedia.org/wiki/Man-in-the-middle_attack)，顾名思义，就是攻击者插入到原本直接通信的双方，让双方以为还在直接跟对方通讯，但实际上双方的通信对方已变成了中间人，信息已经是被中间人获取或篡改。

<br/>
![MITM](http://s017.radikal.ru/i435/1201/07/2df312b053cf.gif)
<br/>

当然，本文并不是科普性文章，本节就针对HTTPS攻击，特别是HTTPS在App这一应用场景下的常见的攻击手段进行分析讨论。

由前文我们知道，HTTPS在建立了TCP连接之后，会进行SSL握手（SSL Handshake）来校验证书，协商加密协议和对称加密的密钥，之后就会使用协商好的密钥来进行传输。所以HTTPS攻击一般分为SSL连接建立前的攻击，以及HTTPS传输过程中的攻击；

常见的HTTPS中间人攻击，首先需要结合ARP、DNS欺骗等技术，来对会话进行拦截，

<br/>
## 1.1 SSL证书欺骗攻击

此类攻击较为简单常见。首先通过ARP欺骗、DNS劫持甚至网关劫持等等，将客户端的访问重定向到攻击者的机器，让客户端机器与攻击者机器建立HTTPS连接（使用伪造证书），而攻击者机器再跟服务端连接。这样用户在客户端看到的是相同域名的网站，但浏览器会提示证书不可信，用户不点击继续浏览就能避免被劫持的。所以这是最简单的攻击方式，也是最容易识别的攻击方式。


此类攻击有个经典的工具：[SSLSniff](http://www.thoughtcrime.org/software/sslsniff/)。SSLSniff是大神[Moxie Marlinspike](https://en.wikipedia.org/wiki/Moxie_Marlinspike)开发的工具，该工具一开始是设计用于上一篇文章中提到的Basic Constaints 漏洞的，这类系统级别的漏洞，基本上可以让你不知不觉；现在的操作系统和浏览器基本修复了这一漏洞。但也可以使用SSLSniff来伪造证书实现钓鱼攻击。


<br/>
![MITM-Sniff](/assets/images/2015-09-16/mitm-sniff.png)
<br/>


### 防范措施：
钓鱼类攻击，App直接调用系统API创建的HTTPS连接（`NSURLConnection`）一般不会受到影响，只使用默认的系统校验，只要系统之前没有信任相关的伪造证书，校验就直接失败，不会SSL握手成功；但如果是使用WebView浏览网页，需要在UIWebView中加入较强的授权校验，禁止用户在校验失败的情况下继续访问。



<br/>
## 1.2 SSL剥离攻击（[SSLStrip](http://www.thoughtcrime.org/software/sslstrip/)）


SSL剥离，即将HTTPS连接降级到HTTP连接。假如客户端直接访问HTTPS的URL，攻击者是没办法直接进行降级的，因为HTTPS与HTTP虽然都是TCP连接，但HTTPS在传输HTTP数据之前，需要在进行了SSL握手，并协商传输密钥用来后续的加密传输；假如客户端与攻击者进行SSL握手，而攻击者无法提供可信任的证书来让客户端验证通过进行连接，所以客户端的系统会判断为SSL握手失败，断开连接。

该攻击方式主要是利用用户并不会每次都直接在浏览器上输入https://xxx.xxx.com来访问网站，或者有些网站并非全网HTTPS，而是只在需要进行敏感数据传输时才使用HTTPS的漏洞。中间人攻击者在劫持了客户端与服务端的HTTP会话后，将HTTP页面里面所有的`https://`超链接都换成`http://`，用户在点击相应的链接时，是使用HTTP协议来进行访问；这样，就算服务器对相应的URL只支持HTTPS链接，但中间人一样可以和服务建立HTTPS连接之后，将数据使用HTTP协议转发给客户端，实现会话劫持。

这种攻击手段更让人难以提防，因为它使用HTTP，不会让浏览器出现HTTPS证书不可信的警告，而且用户很少会去看浏览器上的URL是`https://`还是`http://`。特别是App的WebView中，应用一般会把URL隐藏掉，用户根本无法直接查看到URL出现异常。


<br/>
![MITM-Sniff](/assets/images/2015-09-16/mitm-sslstrip.png)
<br/>


### 防范措施：
该种攻击方式同样无法劫持App内的HTTPS连接会话，因为App中传入请求的URL参数是固定带有`https://`的；但在WebView中打开网页同样需要注意，在非全网HTTPS的网站，建议对WebView中打开的URL做检查，检查应该使用`https://`的URL是否被篡改为`http://`；也建议服务端在配置HTTPS服务时，加上“HTTP Strict Transport Security”配置项。

参考：[【流量劫持】躲避HSTS的HTTPS劫持](http://www.cnblogs.com/index-html/p/https_hijack_hsts.html)


<br/>
## 1.3 针对SSL算法进行攻击

上述两种方式，技术含量较低，而且一般只能影响 WebApp，而很难攻击到 Native App ， 所以高阶的 Hacker，会直接针对SSL算法相关漏洞进行攻击，期间会使用很多的密码学相关手段。由于本人非专业安全相关人员，没有多少相关实践经验，所以本节不会深入讲解相关的攻击原理和手段，有兴趣的同学可以查看以下拓展阅读：

* [OpenSSL漏洞](https://www.openssl.org/news/vulnerabilities.html)
* [常见的HTTPS攻击方法](http://drops.wooyun.org/tips/4403)

<br/>
### 防范措施：
这类攻击手段是利用SSL算法的相关漏洞，所以最好的防范措施就是对服务端 SSL/TLS 的配置进行升级：

* 只支持尽量高版本的TLS（最低TLSv1）；
* 禁用一些已爆出安全隐患的加密方法；
* 使用2048位的数字证书；


<br/>
## 1.4 模拟最简单的攻击


经过上述几种攻击方式的说明之后，我们来模拟下最简单的中间人攻击。

中间人攻击步骤方式的上文已经说过了，流量劫持相关操作不是本文重点，可以参考[流量劫持是如何产生的？](http://www.cnblogs.com/index-html/p/traffic-hijack.html)， 本例直接使用Charles来做代理，对流量进行劫持。并使用[SSL代理](http://www.charlesproxy.com/documentation/using-charles/ssl-certificates/)来模拟下对iPhone设备HTTPS请求的中间人攻击，让大家在思考理解中间人攻击方式的同时，了解在开发中如何防范类似的攻击。

<br/>
### 1) Charles设置代理

在Charles中开启并设置HTTP代理和SSL代理，Menu -> Proxy -> Proxy Setting，设置如图：

HTTP代理设置，注意记住端口号为：8888

![Charles HTTP Proxy](/assets/images/2015-09-16/charles-http-proxy.jpg)<br/>


SSL代理设置，在Locations上可以设置想要进行SSL代理的域名，这里以百度的百付宝`*.baifubao.com`为模拟对象。


![Charles SSL Proxy](/assets/images/2015-09-16/charles-ssl-proxy.jpg)<br/>


<br/>
### 2) 在iPhone端设置HTTP代理

在Mac上获取当前机器的IP地址：

`ifconfig en0`:

![ifconfig](/assets/images/2015-09-16/ifconfig.jpg)<br/>
<br/>

还有一个简单的方法，按住option+点击顶部菜单栏的WiFi网络图标：

![ifconfig](/assets/images/2015-09-16/option-wifi.jpg)<br/>


可以看到当前电脑的IP地址为：`192.168.199.249`。

将iPhone连接到与电脑相同的WiFi，在iPhone设置中：无线局域网 -> 已连接WiFi右边的Info详情图标 -> HTTP代理 -> 手动 -> 设置HTTP代理：

![ifconfig](/assets/images/2015-09-16/iphone-http-proxy.jpg)<br/>

设置完成之后，打开Safari随便访问一个网页，初次设置代理的话，Charles会弹出一个iPhone请求代理的确认框，点击Allow即可。然后在Charles上就可以看到iPhone上的HTTP请求了。为了避免Mac上的请求过多影响对被代理iPhone上HTTP请求的查看和调试，可以在Charles取消Mac的代理：Menu -> Proxy -> 取消勾选Mac OS X Proxy 即可。

假如你访问的是被代理的目标 URL [http://www.baifubao.com](http://www.baifubao.com) 则打不开网页。因为iPhone的HTTPS请求已经被Charles拦截，但iPhone无法信任Charles的证书，所以SSL Handshake失败，无法建立HTTPS连接。

![SSLHandshake](/assets/images/2015-09-16/charles-ssl-handshake-failed.jpg)<br/>




<br/>
### 3) 伪造证书欺骗


在被代理的iPhone上打开Safari，访问[http://www.charlesproxy.com/getssl](http://www.charlesproxy.com/getssl)，会弹出安装描述符文件的界面，该描述文件包含了Charles根证书：

![Charles Root Cer](/assets/images/2015-09-16/charles-root-cer.jpg)<br/>

注意：这个Charles证书是内置在Charles中的，可以在菜单Help -> SSL Proxying可以直接保存和安装证书。安装后的描述文件可以在iPhone设备的设置 -> 通用 -> 描述文件进行查看和管理。

“安装”完成之后，就会将Charles根证书加入系统可信任证书列表中，使用该证书签发的子证书也会被系统信任。Charles会为之前SSL代理设置中配置的域名生成对应的SSL证书，这样伪造证书的证书就实现了欺骗。可以使用Mac SSL代理查看下：

![Baidu Cer](/assets/images/2015-09-16/baidu-cer.jpg)<br/>


<br/>
### 4) 结果验证

下载百度App，然后登录账号，在我 -> 我的钱包，就会访问百付宝：

![Proxy Success](/assets/images/2015-09-16/baifubao-ssl-proxy-success.jpg)<br/>

看到已成功获取到HTTPS请求包的内容。从这里，我们可以猜测出该App是使用系统默认的校验方式：系统信任了这个中间人服务器返回的SSL证书，App就信任了这一校验，SSL握手成功；而没有对服务器证书进行本地对比校验。这是当下非常多App存在的安全隐患。

这个简单的SSL代理模拟了简单钓鱼式的中间人攻击，大家应该都基本明白了这种攻击方式的所针对的漏洞，以及防范这种攻击方法的措施：

* 不要随意连入公共场合内的WiFi，或者使用未知代理服务器
* 不要安装不可信或突然出现的描述文件，信任伪造的证书；
* App内部需对服务器证书进行单独的对比校验，确认证书不是伪造的；


<br/><br/>
# <a name="verify_safely"></a>2. 校验证书的正确姿势

上一节对中间人攻击进行了简单介绍，本节就上一节我们遇到的安全隐患问题，来讨论下在App中，应该怎么校验服务器返回的SSL证书，来保证HTTPS通信的安全。上一篇文章[《iOS安全系列之一：HTTPS》]({% post_url 2014-10-21-Security-1-HTTPS %})有对基本校验过程相关代码进行讲解，本文不会赘述这些细节，而是主要讨论校验证书中几个重要的点：

<br/>
## 2.1 域名验证

前不久，iOS上最知名的网络开源库AFNetworking爆出[HTTPS校验漏洞](http://blog.mindedsecurity.com/2015/03/ssl-mitm-attack-in-afnetworking-251-do.html)，该漏洞是因为其校验策略模块 `AFSecurityPolicy` 内的参数 `validatesDomainName` 默认为NO，这会导致校验证书的时候不会校验这个证书对应的域名。即请求返回的服务器证书，只要是可信任CA机构签发的，都会校验通过，这是非常严重的漏洞。该漏洞已在v2.5.2版本中修复，对应Git版本号[3e631b203dd95bb82dfbcc2c47a2d84b59d1eeb4](https://github.com/AFNetworking/AFNetworking/commit/3e631b203dd95bb82dfbcc2c47a2d84b59d1eeb4#diff-508d2e2e91b3a2789fb4bf053ec4b125)。

这个漏洞以及AFNetworking的相关源码会让很多人以为系统的默认校验是不校验证书对应域名的，实际上并非如此。这里AFNetworking确有画蛇添足之嫌。首先我们查看下系统的默认校验策略：

{% highlight Objective-C %}
- (void)connection:(NSURLConnection *)connection willSendRequestForAuthenticationChallenge:(NSURLAuthenticationChallenge *)challenge {
    //1)获取trust object
    SecTrustRef trust = challenge.protectionSpace.serverTrust;

    //获取默认的校验策略
    CFArrayRef defaultPolicies = NULL;
    SecTrustCopyPolicies(serverTrust, &defaultPolicies);
    NSLog(@"Default Trust Policies: %@", (__bridge id)defaultPolicies);

    //...
}
{% endhighlight %}

打印默认校验策略信息：

```
    5 : <CFString 0x197814dc0 [0x196ea5fa0]>{contents = "ValidRoot"} = <CFBoolean 0x196ea6340 [0x196ea5fa0]>{value = true}
    6 : <CFString 0x197814b20 [0x196ea5fa0]>{contents = "SSLHostname"} = <CFString 0x170226b60 [0x196ea5fa0]>{contents = "xxx.xxx.com"}
    8 : <CFString 0x197814da0 [0x196ea5fa0]>{contents = "ValidLeaf"} = <CFBoolean 0x196ea6340 [0x196ea5fa0]>{value = true}
```

从打印信息来看，系统的默认校验策略中已包含了域名校验。然后再看`AFSecurityPolicy`中相关源码：

{% highlight Objective-C %}
- (BOOL)evaluateServerTrust:(SecTrustRef)serverTrust
                  forDomain:(NSString *)domain
{
    NSMutableArray *policies = [NSMutableArray array];
    if (self.validatesDomainName) {
        [policies addObject:(__bridge_transfer id)SecPolicyCreateSSL(true, (__bridge CFStringRef)domain)];
    } else {
        [policies addObject:(__bridge_transfer id)SecPolicyCreateBasicX509()];
    }

    SecTrustSetPolicies(serverTrust, (__bridge CFArrayRef)policies);

    //...
}
{% endhighlight %}

这其实也是很多开发者在处理异常与默认逻辑分支时会犯的错误，这段逻辑推荐实现方式是：


{% highlight Objective-C %}
//取代validatesDomainName，默认为NO，就是系统默认行为
@property (nonatomic, assign) BOOL skipDomainNameValidation;

//校验
- (BOOL)evaluateServerTrust:(SecTrustRef)serverTrust
                  forDomain:(NSString *)domain
{
    if (self.skipDomainNameValidation) {
        NSMutableArray *policies = [NSMutableArray array];
        [policies addObject:(__bridge_transfer id)SecPolicyCreateBasicX509()];
        SecTrustSetPolicies(serverTrust, (__bridge CFArrayRef)policies);
    }

    //...
}

{% endhighlight %}

从代码上看，逻辑是否变得更清晰了？而且也表明系统默认的校验方式是会验证域名的。实际上调用`SecTrustSetPolicies`来重新设置校验策略，主要是用于使用IP进行HTTPS请求，或者一个证书用于多个域名的场景；在这些场景下，服务器证书上的域名和请求域名（可能是IP，也可能是其他域名）就会出现不一致，导致校验不通过；这就需要重新设置下校验策略，把这个证书对应的域名设置下。详细说明请查看官方文档：[《Overriding TLS Chain Validation Correctly》](https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/NetworkingTopics/Articles/OverridingSSLChainValidationCorrectly.html)



<br/>
## 2.2 校验证书链？

[上一篇文章]({% post_url 2014-10-21-Security-1-HTTPS %})介绍系统验证SSL证书的方法和流程时，不是已经说明了会对证书链进行层层校验，以保证证书的可信么？为什么还需要讨论这一问题？其实本节要讨论的是`AFNetworking`中`validatesCertificateChain`的问题。

先说明下结果：在`AFNetworking`最新发布的[V2.6.0](https://github.com/AFNetworking/AFNetworking/releases/tag/2.6.0)，已经将该特性去掉了。相关的讨论：[SSL Pinning: What Should Be Certificate Chain Validation Expected Behavior?#2744](https://github.com/AFNetworking/AFNetworking/issues/2744)

`AFNetworking`中实现的验证证书链，是将App本地打包好的证书与服务器返回的证书链进行数据上的一一对比，只有打包到App的证书中包含了服务器返回的证书链上的所有证书，校验才会通过。如google的SSL证书：

![Google Cer Chain](/assets/images/2014-10-21/google-cer.png)<br/>

开启`validatesCertificateChain`后请求[https://google.com](https://google.com)，需要将GeoTrust Global CA、Google Internet Authority G2和google.com的证书都导入App中才能验证通过。请回忆下[上一篇文章]({% post_url 2014-10-21-Security-1-HTTPS %})关于证书链的可信任机制，会发现这是完全没有必要的；证书链的验证，主要由三部分来保证证书的可信：叶子证书是对应HTTPS请求域名的证书，根证书是被系统信任的证书，以及这个证书链之间都是层层签发可信任链；证书之所以能成立，本质是基于信任链，这样任何一个节点证书加上域名校验（CA机构不会为不同的对不同的用户签发相同域名的证书），就确定一条唯一可信证书链，所以不需要每个节点都验证。

<br/>
## 2.3打包证书校验

那是否就不需要在App中打包证书进行验证了呢？

这时需要想想为什么伪造证书是可以实现中间人攻击的？答案就在于用户让系统信任了不应该信任的证书。用户设置系统信任的证书，会作为锚点证书(Anchor Certificate)来验证其他证书，当返回的服务器证书是锚点证书或者是基于该证书签发的证书（可以是多个层级）都会被信任。这就是基于信任链校验方式的最大弱点。我们不能完全相信系统的校验，因为系统的校验依赖的证书的源很可能被污染了。这就需要选取一个节点证书，打包到App中，作为Anchor Certificate来保证证书链的唯一性和可信性。

所以还是需要App本地打包证书，使用`SecTrustSetAnchorCertificates(SecTrustRef trust, CFArrayRef anchorCertificates)`来设置Anchor Certificate进行校验。需要注意的是，官方文档[《Certificate, Key, and Trust Services Reference》](https://developer.apple.com/library/mac/documentation/Security/Reference/certifkeytrustservices/#//apple_ref/c/func/SecTrustCopyAnchorCertificates)针对传入的 Anchor Certificates 有说明：

>
>IMPORTANT

>Calling this function without also calling SecTrustSetAnchorCertificatesOnly disables the trusting of any anchors other than the ones specified by this function call.


也就是说，单纯调用`SecTrustSetAnchorCertificates`方法后不调用`SecTrustSetAnchorCertificatesOnly`来验证证书，则只会相信`SecTrustSetAnchorCertificates`传入的证书，而不会信任其他锚点证书。关于这一点，`SecTrustSetAnchorCertificatesOnly`方法参数讲解中也有说明：


>anchorCertificatesOnly:

>If true, disables trusting any anchors other than the ones passed in with the SecTrustSetAnchorCertificates function.  If false, the built-in anchor certificates are also trusted. If SecTrustSetAnchorCertificates is called and SecTrustSetAnchorCertificatesOnly is not called, only the anchors explicitly passed in are trusted.


只相信传入的锚点证书，也就只会验证通过由这些锚点证书签发的证书。这样就算被验证的证书是由系统其他信任的锚点证书签发的，也无法验证通过。

最后一个问题：选择证书链的哪一节点作为锚点证书打包到App中？很多开发者会直接选择叶子证书。其实对于自建证书来说，选择哪一节点都是可行的。而对于由CA颁发的证书，则建议导入颁发该证书的CA机构证书或者是更上一级CA机构的证书，甚至可以是根证书。这是因为：

1) 一般叶子证书的有效期都比较短，Google和Baidu官网证书的有效期也就几个月；而App由于是客户端，需要一定的向后兼容，稍疏于检查，今天发布，过两天证书就过期了。

2) 越往证书链的末端，证书越有可能变动；比如叶子证书由特定域名(aaa.bbb.com)改为通配域名(*.bbb.com)等等。短期内的变动，重新部署后，有可能旧版本App更新不及时而出现无法访问的问题。

因此使用CA机构证书是比较合适的，至于哪一级CA机构证书，并没有完全的定论，你可以自己评估选择。



<br/><br/>
# <a name="ats"></a>3. ATS


在本文发表的时间（2015-09-03），大部分的iOS开发同学应该升级到iOS9了，在iOS9下进行HTTP/HTTPS请求时会遇到如下错误：

>
>Request failed: Error Domain=NSURLErrorDomain Code=-1022 "The resource could not be loaded because the App Transport Security policy requires the use of a secure connection." UserInfo=0x7fbb4a158f00 {NSUnderlyingError=0x7fbb4a1141c0 "The resource could not be loaded because the App Transport Security policy requires the use of a secure connection.", NSErrorFailingURLStringKey=http://api.xxx.com/mobile, NSErrorFailingURLKey=http://api.xxx.com/mobile, NSLocalizedDescription=The resource could not be loaded because the App Transport Security policy requires the use of a secure connection.}




这是iOS9中一个重大的更新：[App Transport Security](https://developer.apple.com/library/prerelease/ios/technotes/App-Transport-Security-Technote/)，简称ATS。ATS对使用NSURLConnection, CFURL, 或NSURLSession 等 APIs 进行网络请求的行为作了一系列的强制要求，反逼服务器配置，以提高网络数据传输的安全性：


>
>These are the App Transport Security requirements:
>
>1) The server must support at least Transport Layer Security (TLS) protocol version 1.2.

>2) Connection ciphers are limited to those that provide forward secrecy (see the list of ciphers below.)

>3) Certificates must be signed using a SHA256 or better signature hash algorithm, with either a 2048 bit or greater RSA key or a 256 bit or greater Elliptic-Curve (ECC) key. Invalid certificates result in a hard failure and no connection.


ATS要求运行在iOS9的App，需将HTTP连接升级到HTTPS，并且TLS版本不得低于v1.2；而且规定了支持的密码套件(Cipher Suite)和证书签名的哈希算法；如果想要向前兼容的话，可以通过设置Info.plist来降低校验强度，具体可以看这篇文章：[Configuring App Transport Security Exceptions in iOS 9 and OSX 10.11](http://ste.vn/2015/06/10/configuring-app-transport-security-ios-9-osx-10-11/)。

本人升级到iOS9 GM版，从App Store上下载了一些并没有完全支持ATS的应用，使用起来也完全没有问题，估计iOS系统对使用低于SDK9编译的App做了兼容，这方面也是符合预期的，毕竟ATS的影响实在太大，基本上没有任何的App能够幸免，比如图片下载一般使用HTTP，而不会使用HTTPS。所以建议可以暂时使用`NSAllowsArbitraryLoads`来取消ATS的限制，后续慢慢完善对ATS的支持。

日益复杂脆弱的网络难以保证用户的数据安全，因此Apple才在iOS9上强推ATS，反向逼迫服务端升级，以提供更安全的网络环境。建议开发者不要简单地将ATS禁用，而应该升级服务器的配置支持ATS，为用户提供更安全的服务。


<br/>
# <a name="debug_ssl"></a>4. 调试SSL/TLS

开发一个新的App，通常终端和后端先协商好了具体业务逻辑的通信协议，后端和终端按照协议实现逻辑之后，就进入联调阶段，第一次联调往往会回到很多问题，包括数据格式不对，缺少基础字段等；假如是基于HTTPS的网络请求，则很可能由于后台配置问题，导致遇到如`CFNetwork SSLHandshake failed (-9824)`这类握手失败的错误。面对这类SSL错误，该如何来解决呢？根据本人经验，主要是分两步：

##4.1 错误码

这会不会太简单了？其实最简单的往往是最有效的。SSL相关错误码可以在`<Security/SecureTransport.h>`中找到。上面`-9824`的错误，对应的是`errSSLPeerHandshakeFail     = -9824,    /* handshake failure */`，其他常见的错误码还有：

{% highlight Objective-C %}

    //...

    /* fatal errors detected by peer */
    errSSLPeerUnexpectedMsg     = -9819,    /* unexpected message received */
    errSSLPeerBadRecordMac      = -9820,    /* bad MAC */
    errSSLPeerDecryptionFail    = -9821,    /* decryption failed */
    errSSLPeerRecordOverflow    = -9822,    /* record overflow */
    errSSLPeerDecompressFail    = -9823,    /* decompression failure */
    errSSLPeerHandshakeFail     = -9824,    /* handshake failure */
    errSSLPeerBadCert           = -9825,    /* misc. bad certificate */
    errSSLPeerUnsupportedCert   = -9826,    /* bad unsupported cert format */
    errSSLPeerCertRevoked       = -9827,    /* certificate revoked */
    errSSLPeerCertExpired       = -9828,    /* certificate expired */
    errSSLPeerCertUnknown       = -9829,    /* unknown certificate */
    errSSLIllegalParam          = -9830,    /* illegal parameter */
    errSSLPeerUnknownCA         = -9831,    /* unknown Cert Authority */
    errSSLPeerAccessDenied      = -9832,    /* access denied */


    /* more errors detected by us */
    errSSLHostNameMismatch      = -9843,    /* peer host name mismatch */
    errSSLConnectionRefused     = -9844,    /* peer dropped connection before responding */
    errSSLDecryptionFail        = -9845,    /* decryption failure */
    errSSLBadRecordMac          = -9846,    /* bad MAC */
    errSSLRecordOverflow        = -9847,    /* record overflow */
    errSSLBadConfiguration      = -9848,    /* configuration error */

    //...
{% endhighlight %}


但靠错误码只能判断大概的情况，很多时候并不能明确知道到底是什么原因导致的，所以最直观的，还是需要抓包分析。



##4.2 抓包分析

在这一阶段，使用Charles来抓包是没有用的，因为Charles是作为HTTP代理工作的，它会抓取代理的网络报文，然后将报文组合成HTTP/HTTPS协议包，对于HTTP调试非常方便，但由于细节的缺失，没办法使用它来分析SSL相关错误。所以我们需要使用上古神器Wireshark。

关于Wireshark就不再多介绍了，网上已经有很多相关介绍和抓包教程，如[《Mac OS X上使用Wireshark抓包》](http://blog.csdn.net/phunxm/article/details/38590561)等，基本上可以很快上手。下面我们就以适配iOS9的ATS为例，来说下如何进行抓包分析，找出因为不支持ATS导致SSL握手失败问题。

还记得SSL握手过程么？不记得可以重温下这篇文章：[图解SSL/TLS协议](http://www.ruanyifeng.com/blog/2014/09/illustration-ssl.html)。我们也来看看Wireshark上抓取到的包来直观学习正常的SSL握手流程：

![Wireshark SSL Handshake](/assets/images/2015-09-16/wireshark-ssl-handshake.png)<br/>

上图是一个标准的HTTPS请求抓取的包：

1) 在TCP三次握手成功之后，客户端发起SSL的`Client Hello`(No.68帧)，传递随机数(Random)，和客户端支持的密码套件(Cipher Suites)、压缩方法、签名算法等信息；
    如下图所示，这是`Client Hello`所携带的信息，可以展开来看相关的详情：

![Client Hello](/assets/images/2015-09-16/wireshark-ssl-client-hello.png)<br/>

2) 服务器从`Client Hello`中匹配支持的密码套件(Cipher Suites)、压缩算法和签名算法，和服务器新生成的一个随机数返回给客户端，这就是`Server Hello`(No.70帧)。
    下图就是对1)中`Client Hello`的回应，由图可以看出，服务端匹配的Cipher Suite是TLS_DHE_RSA_WITH_AES_256_CBC_SHA256：

![Server Hello](/assets/images/2015-09-16/wireshark-ssl-server-hello.png)<br/>


3) 服务器同时会将证书发给客户端(No.73帧)；有时候抓取的包只有`Client Hello`和`Server Hello`，而没有再发送证书的，这是SSL/TLS的Session重用了：由于新建立一个SSL/TLS Session的成本太高，所以之前有建立SSL/TLS连接Session的话，客户端会保存Session ID，在下一次请求时在`Client Hello`中带上，服务端验证有效之后，就会成功重用Sesssion。

拓展阅读：

* [RFC5246#Handshake Protocol Overview](https://tools.ietf.org/html/rfc5246#section-7.3)查看Handshake的流程和相关信息。
* Apple官方开发文档：[TLS Session Cache](https://developer.apple.com/library/ios/qa/qa1727/_index.html)

<br/>
4) 客户端确认证书有效，则会生产最后一个随机数(Premaster secret)，并使用证书的公钥RSA加密这个随机数，发回给服务端。为了更高的安全性，会改为[Diffie-Hellman算法](http://zh.wikipedia.org/wiki/迪菲－赫尔曼密钥交换)（简称DH算法）；采用DH算法，最后一个随机数(Premaster secret)是不需要传递的，客户端和服务端交换参数之后就可以算出。`Client Key Exchange`(No. 75帧)；

5) 接下来双方都会发送`Change Cipher Spec`通知对方，接下来的所有消息都会使用签名约定好的密钥进行加密通信。

6) 最后是双方的`Finished Message`（即`Encrypted Handshake Message`， No. 77、79帧），这个消息是最终的校验，里面包含了握手过程中的Session Key等信息，如果对方能够解密这个消息则表示握手成功，结束整个SSL Handshake流程。



相关SSL/TLS接口信息，请查看：[RFC5246](https://tools.ietf.org/html/rfc5246)以及[SSL/TLS in Detail](https://technet.microsoft.com/en-us/library/cc785811.aspx)


上面已抓取的HTTPS请求为例，简单介绍了SSL/TLS的握手流程。下面就列举下调试适配ATS过程中遇到的主要问题：

<br/>
1) 密码套件（Cipher Suite）等参数无法匹配：密码套件不匹配是最常见的握手失败的例子。

在ATS中，可接受的密码套件有包括：

```
TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384
TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384
TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA
TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256
TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA
TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384
TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256
TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA
```

但往往很多服务器的HTTPS配置很久没有升级，没办法支持这些Cipher Suite；客户端发送`Client Hello`给服务端，带上支持密码套件参数；服务端查看这些参数，发现一个都不支持，则直接返回`Handshake Failure`的信息。如下图：

![Handshake Failure](/assets/images/2015-09-16/wireshark-handshake-failure1.png)<br/>


一般在接受到客户端发送的`Client Hello`后返回`Handshake Failure`，都是因为服务端无法匹配客户端SSL握手参数。至于是不是密码套件这个参数匹配的问题，建议抓取取消ATS了的正常HTTPS请求包进行对比，找出具体不匹配的参数。


<br/>
2) SSL/TLS版本过低，这个也非常常见，但一般会被上一个参数不匹配的错误所掩盖。因为大多数SSL/TLS版本低的服务器HTTPS配置支持的密码套件等参数版本也比较低，而SSL/TLS版本是客户端收到`Server Hello`之后才验证的，但前面握手失败就走不到这一步了。所以密码套件（Cipher Suite）等参数无法匹配支持，一般也就意味着服务端SSL/TLS版本过低。

<br/>
3) 证书链配置错误：在开发过程中，本人遇到过证书链没有按照顺序进行配置的问题，也遇到过只配置了叶子证书的问题。对于这些问题，可以直接查看SSL握手过程中，服务端返回的`Certificate`包：

![SSL Certificate error](/assets/images/2015-09-16/wireshark-ssl-certificate-chain-err.png)<br/>

上图可以看到证书链`Certificates`只有一个，这是典型的配置错误。

PS：使用Wireshark进行抓包的时候，有时候由于一些HTTPS请求的SSL/TLS版本号太低，Wireshark没办法辨认其是SSL包，而是显示为TCP；此时可以手动来Decode：选择对应的TCP数据帧，右键 -》Decode As -》Transport 选择SSL -》Apply既可。

![Wireshark Decode](/assets/images/2015-09-16/wireshark-decode-as.png)<br/>




<br/><br/>
# <a name="summary"></a>5. 后记

这个时代，安全重要么？这是我曾常疑惑的。90%以上的大众对安全没有切实的概念，即使安全上了春晚，过了热潮一切又重归原样。特别最近换工作到保险金融类公司，安全问题更是触目惊心。一直相信，人如同一个圆，你知道的越多，学的越深，接触的越广，圆就越大，越知道自己的渺小，越懂得敬畏。

这世界永远不会缺少矛和盾，没有**“Mission Impossible”**，不是么？


---

版权所有，转载请保留[Jaminzzhang](http://oncenote.com/)署名






