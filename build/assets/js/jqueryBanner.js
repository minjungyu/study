(function(){
	'use strict';
	/* cppMainBanner script custom ver
	 * 2017.02.02 / doubleslash & CTTD
	 * 
	 * 
	 * jQueryElement.cppMainBanner( {options}, 'method', callback() );

	 * {options}
	 * bannerItem : '.main_bnr__item', // banner 리스트 클래스
	 * bannerBox : '.main_bnr__list', // banner 리스트 상위 클래스
	 * bannerItemStringClass : '.hide', // banner 리스트의 각각 내용 텍스트
	 * insertPage : '.page_rolling', // pagination 이 삽입될 영역 클래스 혹은 아이디
	 * pageHtm : '<a href="#" class="spr_cpp bt_roll {{active}}">{{index}}</a>', // pagination 의 html , {{active}} : 활셩화 되는 pageActiveClass 가 경우에 따라 추가됨. {{index}}  : 각 페이지의 번호가 추가됨.
	 * pageActiveClass : 'on', // 페이지의 활성화 추가에 필요한 클래스 
	 * btnPrev : '.bnr_prev', // 이전 버튼
	 * btnNext : '.bnr_next', // 다음버튼
	 * btnDescription : '.txt', // 버튼에 추가되는 이전, 다음 베너의 텍스트.
	 * loadImg : '//pics.auction.co.kr/vertical/ticket/loading_small.gif',
	 * imgLoader : true, // 이미지 로더를 사용할지 유무.
	 * startPage : 0, // 최초 노출할 페이지 ( 0 부터 )
	 * auto : true, // 자동 롤링 활성화 유무
	 * autoTimer : 4500, // 자동롤링시 시간.
	 * minSize : 1200, // 최소 width
	 * normalSize : 1600 // 베너의 기본 사이즈.
	*/
	function mainBanner_v2 (  element, options, callback ){
		var defaults = {
			bannerItem : '.main_bnr__item', // banner 리스트 클래스
			bannerBox : '.main_bnr__list', // banner 리스트 상위 클래스
			bannerItemStringClass : '.hide', // banner 리스트의 각각 내용 텍스트
			insertPage : '.page_rolling', // pagination 이 삽입될 영역 클래스 혹은 아이디
			pageHtm : '<a href="#" class="spr_cpp bt_roll {{active}}">{{index}}</a>', // pagination 의 html , {{active}} : 활셩화 되는 pageActiveClass 가 경우에 따라 추가됨. {{index}}  : 각 페이지의 번호가 추가됨.
			pageActiveClass : 'on', // 페이지의 활성화 추가에 필요한 클래스 
			btnPrev : '.bnr_prev', // 이전 버튼
			btnNext : '.bnr_next', // 다음버튼
			btnDescription : '.txt', // 버튼에 추가되는 이전, 다음 베너의 텍스트.
			loadImg : '//pics.auction.co.kr/vertical/ticket/loading_small.gif',
			imgLoader : true, // 이미지 로더를 사용할지 유무.
			startPage : 0, // 최초 노출할 페이지 ( 0 부터 )
			auto : true, // 자동 롤링 활성화 유무
			autoTimer : 4500, // 자동롤링시 시간.
			minSize : 1200, // 최소 width
			normalSize : 1600, // 베너의 기본 사이즈.
			moveStart : null,
			moveEnd : null,
			step : null
		};
		var callback = ( callback ) ? callback : undefined;
		var instance = this;
		
		// instance 의 기본 설정.
		instance.rootElement = $( element );
		instance.settings = $.extend( defaults, options );

		// instance elements 
		instance.bannerItem = instance.rootElement.find( instance.settings.bannerItem ); // banner 아이템 ( 통상 LI )들.
		instance.bannerBlock = instance.rootElement.find( instance.settings.bannerBox ); // banner 아이템 ( 통상 LI )들.
		instance.nextBtn = instance.rootElement.find( instance.settings.btnNext ); // 다음버튼
		instance.prevBtn = instance.rootElement.find( instance.settings.btnPrev ); // 이전버튼

		// instance counter 변수
		instance.totalPage = instance.bannerItem.length; // banner 아이템 갯수.
		instance.page = instance.settings.startPage; // 현재 활성화 페이지.
		// 이전, 다음 페이지 번호의 경우 베너 갯수가 2개일경우라는 예외가 발생하므로 init 이후 값을 대입하는 것으로 한다.
		instance.nextPage = null; // 다음페이지 번호.
		instance.prevPage = null; // 이전페이지 번호.
		instance.randomNum = Math.ceil( Math.random()*100000 ) ; // imageLoad 이미지에 들어가는 난수 ID number

		// instance 환경 변수
		instance.isMotioning = false; // 모션이 진행중인지 여부
		instance.isLoaded = false; // background 이미지 로드 상태.
		instance.isClone = false; // banner 가 2개 일 경우 복제하여 4개의 베너를 생성하지만, pagination 은 2개만 노출되야 하므로 분기처리를 위해.

		// instance 의 timer 변수.
		instance.timer = null;
		instance.isHover = false; // 베너 영역에 마우스가 올라와 있는지 체크 한다.

		// init
		mainBanner_v2_init( this, callback ); // init 을 실행.
		
	}

	/*
	 * instance(필수) 와 callback(옵션) 을 인자로 한다.
	 * instance.settings.imgLiader 값에 따라 mainBanner_v2_imgLoadCounter 를 실행한다.
	 * 베너 리스트를 배치하며, 최초 1회만 실행한다.
	*/
	function mainBanner_v2_init ( instance, callback ){
		var cb = ( callback ) ? callback : null,
			tempCounter, // prev, next page 숫자를 배열로 저장.( mainBanner_v2_pageCounter 를 이용 / 베너 갯수 확인 및 필요한 경우 클론 한 뒤 값을 대입.  )
			loadImgs = []; // 이미지 로더를 사용할 경우 이미지의 주소를 저장하기 위해 사용.

		if( instance.settings.imgLoader ){
			// 이미지의 로드를 체크 한다. 로드가 되어 있지 않을 경우 로직을 순회 한다.
			if( !instance.isLoaded ) {
				// 로드 이미지를 추가.
				instance.rootElement.append( '<div id="mainBanner'+instance.randomNum+'" style="position:absolute; width: 100%; height:100%; text-align:center; left:0; top:0;" ><img src='+instance.settings.loadImg+' style="margin-top: 180px;"></div>' );
				// 이미지 로드 상태 체크 
				$.each( instance.bannerItem, function(){
					loadImgs.push( $(this).find('a').css('background-image').replace(/(^url\()|(\)$|[\"\'])/g, '') );
				} );
				mainBanner_v2_imgLoadCounter( loadImgs, instance, function(){
					mainBanner_v2_init( instance, cb );
				} );
			} else {
				// 로드 이미지를 삭제.
				$('#mainBanner'+instance.randomNum).remove();
			}
		} else {
			instance.isLoaded = true;
		}
		
		if( instance.isLoaded ){
			$.each( instance.bannerItem, function( index ){
				$(this).data('index', index)
			} );

			// page 를 생성.
			if( instance.totalPage === 1 ){ // 베너 아이템이 1개일 경우
				// 아이템을 view 처리
				instance.bannerItem.fadeIn('fast');
				// 좌, 우 버튼 등 불필요 엘리먼트 숨김.
				instance.nextBtn.hide();
				instance.prevBtn.hide();
			} else { // 베너 아이템이 2개 이상일 경우
				if ( instance.totalPage <= 3 ) { // 베너 아이템이 3개 이하일 경우 2배로 만든다.( 필요할때 clone 하는 것이 더 비효율 적이므로 )
					// 1 과 2 를 클론하여 붙임.
					$.each( instance.bannerItem, function( index ){
						instance.bannerBlock.append( $(this).clone() );
					} );

					// instance 값을 재설정.
					instance.bannerItem = instance.rootElement.find( instance.settings.bannerItem );
					instance.totalPage = instance.bannerItem.length;
					instance.isClone = true;
				}

				// 이후 정상 진행.

				// 페이지를 갱신.
				tempCounter = mainBanner_v2_pageCounter( instance.page, instance.totalPage );
				instance.prevPage = tempCounter[0];
				instance.nextPage = tempCounter[1];

				// 베너 포지션을 셋팅
				instance.resizeSetting( function(){
					instance.contentsSetting();
					instance.btnText();
				} );

				// 페이지네이션을 생성.
				instance.createPagination( );

				// 이벤트를 추가.
				$(window).on('resize', function(){
					instance.resizeSetting();
				});

				// next 버튼에 이벤트를 추가
				instance.nextBtn.on( 'click', function(){
					instance.next();
					return false;
				} );
				// prev 버튼에 이벤트를 추가
				instance.prevBtn.on( 'click', function(){
					instance.prev();
					return false;
				} );

				instance.rootElement.on('mouseenter', function(){
					instance.isHover = true;
					if( instance.settings.auto ){
						mainBanner_v2_auto.call( instance, 'off' );
					}
				}).on('mouseleave', function(){
					instance.isHover = false;
					if( instance.settings.auto ){
						mainBanner_v2_auto.call( instance, 'on' );
					}
				});

				// auto 실행.
				if( instance.settings.auto ){
					mainBanner_v2_auto.call( instance, 'on' );
				}

				if( cb !== null ){
					cb( instance );
				}
			}
		}
		
	}

	/*
	 * 현재 page :int 와 totalPage :int 를 인자로 받는다 (필수)
	 * page 는 0 부터 카운트 하며, totalPage 는 1부터 카운트 한다( 통상 objs.length 를 사용하므로)
	 * page 와 totalPage 값에 따라 이전 페이지 넘버와 다음 페이지 넘버를 배열로 반환한다.
	*/
	function mainBanner_v2_pageCounter ( page, totalPage ){ // return [ prev Number:int, next Number:int ];
		if( page === 0 ) {
			return [ totalPage-1, 1 ];
		} else if ( page === totalPage-1 ) {
			return [ totalPage-2, 0 ];
		} else {
			return [ page-1, page +1 ];
		}
	}

	/*
	 * src 로 넘어온 인자(배열) 을 로드 한뒤 callback 을 실행한다.
	 * mainBanner_v2 에 존속되므로 instance 를 넘겨 받고 instance 값의 isLoaded 값을 true 로 변환 한다.
	 * error 가 났을 경우에도 우선 load 로 간주 하며, error 시에 특별한 로직은 추가 하지 않았다.
	 * src, instance 는 필수 이며, callback 은 옵션이다.
	*/
	function mainBanner_v2_imgLoadCounter ( src, instance, callback ){
		var imgs = src,
			len = imgs.length,
			counter = 0,
			loadCompFnc = function( ele ){
				ele.remove();
				counter ++;
				if( counter === len ) {
					instance.isLoaded = true;
					callback();
				}
			};
		$.each( imgs, function( index, src ){
			// console.log(src)
			$('<img>').attr('src', src).on('load', function(){
				// image load complete
				loadCompFnc( $(this) );
			}).on('error', function(){
				// image load error.
				loadCompFnc( $(this) );
			})
		} );
	}
	/*
	 * 0부터 시작하며, max 값을 포함한 수 리턴한다.
	 * max 가 5 이고, num 이 6 이면 0 을 리턴한다.
	 * max 가 5 이고, num 이 12 이면 2 를 리턴한다.
	 * max 가 5 이고, num 이 -1 이면 5 를 리턴한다.
	 * max 가 5 이고, num 이 -2 이면 4 를 리턴한다.
	*/
	function maxNumber ( num, max ){
		var m = max + 1;
		if( num < 0 ) {
			return m + num;
		} else {
			return num % m;
		}
	}

	/*
	 * banner 의 가로값을 리턴한다.
	*/
	function pageWidthCall ( normalSize, minSize ){
		var $w = $(window).width();
			this.settings.minSize = ( this.settings.minSize ) ? this.settings.minSize : normalSize;
			this.settings.normalSize = ( this.settings.normalSize ) ? this.settings.normalSize : minSize;
		var w = ( $w > this.settings.normalSize ) ? this.settings.normalSize : $w;
		if( w < this.settings.minSize ) {
			w = this.settings.minSize;
		}

		return w ;
	}

	/*
	 * banner 의 모션을 담당한다.
	*/
	function mainBanner_v2_motion ( counter, callback ){
		var instance = this,
			rootElement = instance.rootElement,
			bannerItem = instance.bannerItem,
			viewEle = bannerItem.eq( instance.page ),
			nextBanner = bannerItem.eq( instance.nextPage ),
			prevBanner = bannerItem.eq( instance.prevPage ),
			activePage = counter,
			pageWidth = pageWidthCall.call( this ),
			// pagePos = ( $(window).width() - pageWidth ) / 2,
			pagePos = 70,
			direction = 'none',
			moveElementLength = 0,
			compCounter = 0,
			comp = function(){
				compCounter ++;
				if( compCounter === moveElementLength ){
					
					var tempCounter,
					    tmpNum;

					if( typeof activePage === 'string' ) {
						tmpNum = ( activePage === 'next' ) ? instance.page + 1 : instance.page - 1;
						instance.page = maxNumber( tmpNum , instance.totalPage-1 );
					} else {
						instance.page = counter;
					}

					tempCounter = mainBanner_v2_pageCounter( instance.page, instance.totalPage );
					instance.prevPage = tempCounter[0];
					instance.nextPage = tempCounter[1];
					instance.btnText();
					instance.resizeSetting( function(){
						instance.rootElement.find( '.cloneElementBanner' ).remove();
					} );
					
					// if( instance.isClone ) {
					// 	activePagination = instance.page % ( instance.totalPage / 2 );
					// } else {
					// 	activePagination = instance.page;
					// }

					// paginationBtn.addClass( 'delete' ).removeClass( instance.settings.pageActiveClass )
					// 	.eq( activePagination ).removeClass('delete').addClass( instance.settings.pageActiveClass );

					instance.isMotioning = false;
					if( callback ) {
						callback( instance );
					}
					if( typeof instance.settings.moveEnd === 'function' ){
						instance.settings.moveEnd( counter, instance );
					}
				}
			},
			
			moveElements = ( function(){
				/*
				 * 움직일 엘리먼트의 셋팅을 위해 배열에 저장하여 리턴한다.
				*/
				var moveEle = [],
					i = 0,
					loop = ( typeof activePage === 'string' ) ? 4 : Math.abs( activePage - instance.page ) + 3 ,
					eqNum, startNum,
					checkKey = {};
				if( typeof activePage === 'string' ) {
					if( activePage === 'next' ) {
						i = -1;
						direction = 'left';
					} else {
						i = -2;
						direction = 'right';
					}
					loop = loop+i;
					for( i; i<loop; i++ ){
						eqNum = maxNumber( instance.page + i , instance.totalPage-1 ) ;
						moveEle.push( bannerItem.eq( eqNum ) );
					}
				} else {
					// console.log( loop )
					startNum = ( instance.page < activePage ) ? instance.page - 1  : activePage - 1; // 좌, 우측 모션에 따라 우선 움직일 넘버 지정.

					for( i; i<loop; i++ ) {
						eqNum = maxNumber( startNum, instance.totalPage-1 );
						if( typeof checkKey[eqNum] === 'undefined' ){
							checkKey[eqNum] = true;
							moveEle.push( bannerItem.eq( eqNum ) );
						} else {
							var tmpEle = bannerItem.eq( eqNum ).clone();
								tmpEle.addClass('cloneElementBanner');
							// bannerItem.eq( eqNum ).parent().append( tmpEle );
							moveEle.push( tmpEle );
						}
						
						startNum ++;
					}
					if( instance.page < activePage ){
						direction = 'left';
					} else {
						direction = 'right';
					}
				}
				return moveEle;
			} )();
			
			// 모션 발생 전에 셋팅을 한다.
			this.isMotioning = true; // 모션 상태값을 셋팅 한다.
			moveElementLength = moveElements.length; // counter 를 셋팅 한다.


			$.each( moveElements, function( index ){
				var num,
					leftPos;
				if( direction === 'left' ){
					num = index - 1;
				} else {
					num = index - ( moveElementLength - 2 );
				}

				leftPos = pagePos + ( pageWidth * num );
				// 300...banner-image--wide2
				if( instance.page === 2 ){

					if( $( this ).hasClass('banner-image--wide2') ){
						leftPos = pagePos + ( pageWidth * num ) + 300;
					}
				}

				if( instance.page === 0 ){
					if( $(this).hasClass('banner-image--wide-left') ){
						leftPos = pageWidth * num
					}
				}
				if( instance.page === instance.totalPage-1 ){
					if( $(this).hasClass('banner-image--wide') ){
						leftPos = pagePos + ( pageWidth * num ) + 410;
					}
				}
				

				$(this).css({
					'left' : leftPos,
					'width' : pageWidth,
					'opacity' : 1
				});
				if( $(this).hasClass('cloneElementBanner') ){
					instance.bannerBlock.append( $(this) );
				}
			} );

			// 모션을 반영한다.
			$.each( moveElements, function( index ){
				var num,
					delay,
					leftPos;
				if( direction === 'left' ) {
					 num = index - ( moveElementLength - 2 );
					 delay = 50 * moveElementLength - 50 * index;
					 
				} else {
					num = index - 1;
					delay = 50 * index;
				}
				leftPos = pagePos + ( pageWidth * num );

				if( $(this).hasClass('banner-image--wide2') && num === 1 ) {
					leftPos = pagePos + ( pageWidth * num ) + 300;
				}

				if( $(this).hasClass('banner-image--wide') ){
					if( num === 1 ){
						leftPos =  pagePos + ( pageWidth * num ) + 410;
					}
				}
				if( $(this).hasClass('banner-image--wide-left') ){
					if( num === -1 ){
						leftPos =  pageWidth * num
					}
				}

				$(this).delay( delay ).animate({
					'left' : leftPos
				},{
					'duration' : 600,
					'easing' : 'easeOutSine',
					complete : function(){
						comp();
					}
				});
			});

			activePageNation( instance, counter, direction );

			
	}

	function activePageNation( instance, counter, direction ){
		var tmpPage = (function(){
			var tmpNum;
			if( typeof counter === 'string' ) {
				tmpNum = ( counter === 'next' ) ? instance.page + 1 : instance.page - 1;
				return maxNumber( tmpNum , instance.totalPage-1 );
			} else {
				return counter;
			}
		})(),
		activePagination = (function(){
			if( instance.isClone ) {
				return tmpPage % ( instance.totalPage / 2 );
			} else {
				return tmpPage;
			}
		})(),
		paginationBtn = instance.rootElement.find('.main-paging-link');

		

		paginationBtn.addClass( 'delete' ).removeClass( instance.settings.pageActiveClass )
			.eq( activePagination ).removeClass('delete').addClass( instance.settings.pageActiveClass );

		if( typeof instance.settings.moveStart === 'function' ){
			instance.settings.moveStart( instance.page, activePagination, direction, instance );
		}
		
	};

	/*
	 * 자동롤링.
	*/
	function mainBanner_v2_auto ( swc )  {
		var instance = this;
		if( swc === 'on' ) {
			if( instance.timer === null && instance.settings.auto && !instance.isHover ) {
				instance.timer = window.setInterval( function(){
					instance.nextBtn.trigger('click');
				}, instance.settings.autoTimer );
			}
		} else {
			if( instance.timer !== null ) {
				 window.clearInterval( instance.timer );
				 instance.timer = null;
			}
		}
		
	}

	/*
	 * 페이지네이션을 생성한다.
	*/
	mainBanner_v2.prototype.createPagination = function( callback ){
		var instance = this,
			insertPagination = instance.rootElement.find( instance.settings.insertPage ),
			htmlTemplate = instance.settings.pageHtm,
			active = instance.settings.pageActiveClass,
			loop = (instance.isClone) ? instance.totalPage/2 : instance.totalPage,
			i=0,
			html = $('<div></div>');
		// 여기서 부터 해야 함.	
		for( i; i<loop; i++ ){
			var tmpClass = (i===instance.page) ? active : 'delete',
				paginationEle = $( htmlTemplate.replace( '{{active}}', tmpClass ).replace( '{{index}}', i ) ).data('index', i);
			paginationEle.on('click', function(){

				instance.goTo( $(this).data('index') );
				return false;
			}).addClass('paginationBtn');
			html.append( paginationEle );
		}
		insertPagination.append( html );
	}

	mainBanner_v2.prototype.next = function( callback ){
		if( this.isMotioning ) return false; // 모션이 진행중이라면 함수 실행을 막는다.
		mainBanner_v2_motion.call( this, 'next' );
	}

	mainBanner_v2.prototype.prev = function(){
		if( this.isMotioning ) return false; // 모션이 진행중이라면 함수 실행을 막는다.
		mainBanner_v2_motion.call( this, 'prev' );

	}

	mainBanner_v2.prototype.goTo = function(index){
		if( this.page === index ) return false;
		if( this.isMotioning ) return false; // 모션이 진행중이라면 함수 실행을 막는다.
		mainBanner_v2_motion.call( this, index );
	}

	mainBanner_v2.prototype.btnText = function( callback ){
		var instance = this,
			rootElement = instance.rootElement,
			bannerItem = instance.bannerItem,
			settings = instance.settings,
			nextBanner = bannerItem.eq( instance.nextPage ),
			prevBanner = bannerItem.eq( instance.prevPage );

		instance.nextBtn
			.find( settings.btnDescription )
			.text( nextBanner.find( settings.bannerItemStringClass ).text() );
		instance.prevBtn
			.find( settings.btnDescription )
			.text( prevBanner.find( settings.bannerItemStringClass ).text() );

		if( callback ){
			callback();
		}
	}

	mainBanner_v2.prototype.resizeSetting = function( callback ){
		/* 
		 * 베너는 기본적으로 1600 가로 사이즈.
		 * 1600 을 초과 하는 경우 좌, 우측에 이전, 다음 베너가 보여지게 됨.
		 * 1600 이하일 경우 좌, 우측 베너를 노출 할 필요는 없음( 성능과 관련. )
		 * window resize 시에 실행됨.
		*/
		var instance = this,
			rootElement = instance.rootElement,
			bannerItem = instance.bannerItem,
			settings = instance.settings,
			$w = $(window).width(),
			pageWidth = pageWidthCall.call( this ),
			// pagePos = ( $w - pageWidth ) / 2,
			pagePos = 70,
			viewBanner = bannerItem.eq( instance.page ),
			nextBanner = bannerItem.eq( instance.nextPage ),
			prevBanner = bannerItem.eq( instance.prevPage );

		var prevPos = (function(){
			if( viewBanner.hasClass('banner-image--wide') ){
				return - pageWidth;
			} else {
				return pagePos - pageWidth;
			}
		});
		var nextPos = (function(){
			if( nextBanner.hasClass('banner-image--wide') ){
				return 480 + pageWidth;
			} else if( nextBanner.hasClass('banner-image--wide2') ){
				return 370 + pageWidth;
			}else{
				return pagePos + pageWidth;
			}
		});
		viewBanner.css({
			'left' : pagePos,
			'width' : pageWidth
		});

		nextBanner.css({
			'left' :nextPos,
			'width' : pageWidth
		});

		prevBanner.css({
			'left' : prevPos,
			'width' : pageWidth
		});

		if( callback ){
			callback();
		}
	}

	mainBanner_v2.prototype.contentsSetting = function( callback ){
		var instance = this,
			$w = $(window).width(),
			settings = instance.settings,
			pageWidth = pageWidthCall.call( this );

		$.each( instance.bannerItem, function( index ){
			$(this).css({
				'width' : pageWidth,
				'z-index' : 2
			});
			if( instance.page === index || instance.nextPage === index || instance.prevPage === index ) {
				$(this).fadeIn('fast').data('view', 'view');
			} else {
				$(this).css({
					'display' : 'block',
					'opacity' : '0',
					'z-index' : 1
				}).data('view','hide');
			}
		} );
	}


	/*
	 * jQuery Plugin 을 추가한다. 
	*/
	if ( !$.fn.cppMainBanner ) {
		$.fn.cppMainBanner = function (){ // {options}, 'method', callback()

			var options,
				method = '',
				callback,
				arg = arguments;
			return this.each( function() {
				var cppMainBanner = $.data( this, 'cppMainBanner' );
				if ( arg.length !== 0 ) {
					$.each( arg, function(){
						switch( typeof this ) {
							case 'string' : method = this;
							break;
							case 'object' : options = this;
							break;
							case 'function' : callback = this;
							break;
						}
					} );
				}

				if( cppMainBanner ) {
					if ( method !== '' && method in CategorySwipe.prototype ){
						if( callback ) {
							cppMainBanner[ method ]( callback );
						} else {
							cppMainBanner[ method ]( );
						}
					}
				} else {
					if( options !== undefined ) {
						$.extend( options, $( this ).data() );
					} else {
						options = $( this ).data();
					}

					$.data( this, 'cppMainBanner', new mainBanner_v2( this, options, callback ) );
				}

			} );

		}
	}

	/*
	 * cppMainBanner script end.
	*/
})( undefined, jQuery );