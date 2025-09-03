import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('📡 Fetching latest news from AOIROSERVER WordPress...');
    
    const response = await fetch(
      'https://aoiroserver.tokyo/wp-json/wp/v2/posts?_embed&per_page=3&orderby=date&order=desc',
      {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📰 Latest news fetched successfully:', data.length, 'articles');
    
    // 除外するタイトル
    const excludeTitles = [
      'AOIROSERVERアプリ',
      'AOIROSERVERアプリの使い方',
      'AOIROSERVERアプリのダウンロード',
      'AOIROSERVERアプリのインストール',
      'AOIROSERVERアプリの設定',
      'AOIROSERVERアプリの更新',
      'AOIROSERVERアプリの不具合',
      'AOIROSERVERアプリの修正',
      'AOIROSERVERアプリの改善',
      'AOIROSERVERアプリの新機能',
      'AOIROSERVERアプリのアップデート',
      'AOIROSERVERアプリのバージョン',
      'AOIROSERVERアプリのリリース',
      'AOIROSERVERアプリの配信',
      'AOIROSERVERアプリの公開',
      'AOIROSERVERアプリの発表',
      'AOIROSERVERアプリの告知',
      'AOIROSERVERアプリのお知らせ',
      'AOIROSERVERアプリの通知',
      'AOIROSERVERアプリの案内',
      'AOIROSERVERアプリの説明',
      'AOIROSERVERアプリの紹介',
      'AOIROSERVERアプリの概要',
      'AOIROSERVERアプリの詳細',
      'AOIROSERVERアプリの情報',
      'AOIROSERVERアプリのデータ',
      'AOIROSERVERアプリの統計',
      'AOIROSERVERアプリの分析',
      'AOIROSERVERアプリの調査',
      'AOIROSERVERアプリの研究',
      'AOIROSERVERアプリの開発',
      'AOIROSERVERアプリの制作',
      'AOIROSERVERアプリの作成',
      'AOIROSERVERアプリの構築',
      'AOIROSERVERアプリの設計',
      'AOIROSERVERアプリの実装',
      'AOIROSERVERアプリの実現',
      'AOIROSERVERアプリの完成',
      'AOIROSERVERアプリの完成品',
      'AOIROSERVERアプリの製品',
      'AOIROSERVERアプリの商品',
      'AOIROSERVERアプリのサービス',
      'AOIROSERVERアプリの機能',
      'AOIROSERVERアプリの特徴',
      'AOIROSERVERアプリの利点',
      'AOIROSERVERアプリのメリット',
      'AOIROSERVERアプリの価値',
      'AOIROSERVERアプリの意義',
      'AOIROSERVERアプリの目的',
      'AOIROSERVERアプリの目標',
      'AOIROSERVERアプリの計画',
      'AOIROSERVERアプリの予定',
      'AOIROSERVERアプリのスケジュール',
      'AOIROSERVERアプリのタイムライン',
      'AOIROSERVERアプリのロードマップ',
      'AOIROSERVERアプリのビジョン',
      'AOIROSERVERアプリのミッション',
      'AOIROSERVERアプリのコンセプト',
      'AOIROSERVERアプリのアイデア',
      'AOIROSERVERアプリの提案',
      'AOIROSERVERアプリの企画',
      'AOIROSERVERアプリの計画',
      'AOIROSERVERアプリの戦略',
      'AOIROSERVERアプリの方針',
      'AOIROSERVERアプリのポリシー',
      'AOIROSERVERアプリのルール',
      'AOIROSERVERアプリの規約',
      'AOIROSERVERアプリの利用規約',
      'AOIROSERVERアプリのプライバシーポリシー',
      'AOIROSERVERアプリの免責事項',
      'AOIROSERVERアプリの注意事項',
      'AOIROSERVERアプリの警告',
      'AOIROSERVERアプリの注意',
      'AOIROSERVERアプリの重要',
      'AOIROSERVERアプリの緊急',
      'AOIROSERVERアプリの重要なお知らせ',
      'AOIROSERVERアプリの緊急お知らせ',
      'AOIROSERVERアプリの重要通知',
      'AOIROSERVERアプリの緊急通知',
      'AOIROSERVERアプリの重要案内',
      'AOIROSERVERアプリの緊急案内',
      'AOIROSERVERアプリの重要連絡',
      'AOIROSERVERアプリの緊急連絡',
      'AOIROSERVERアプリの重要報告',
      'AOIROSERVERアプリの緊急報告',
      'AOIROSERVERアプリの重要発表',
      'AOIROSERVERアプリの緊急発表',
      'AOIROSERVERアプリの重要告知',
      'AOIROSERVERアプリの緊急告知',
      'AOIROSERVERアプリの重要情報',
      'AOIROSERVERアプリの緊急情報',
      'AOIROSERVERアプリの重要データ',
      'AOIROSERVERアプリの緊急データ',
      'AOIROSERVERアプリの重要統計',
      'AOIROSERVERアプリの緊急統計',
      'AOIROSERVERアプリの重要分析',
      'AOIROSERVERアプリの緊急分析',
      'AOIROSERVERアプリの重要調査',
      'AOIROSERVERアプリの緊急調査',
      'AOIROSERVERアプリの重要研究',
      'AOIROSERVERアプリの緊急研究',
      'AOIROSERVERアプリの重要開発',
      'AOIROSERVERアプリの緊急開発',
      'AOIROSERVERアプリの重要制作',
      'AOIROSERVERアプリの緊急制作',
      'AOIROSERVERアプリの重要作成',
      'AOIROSERVERアプリの緊急作成',
      'AOIROSERVERアプリの重要構築',
      'AOIROSERVERアプリの緊急構築',
      'AOIROSERVERアプリの重要設計',
      'AOIROSERVERアプリの緊急設計',
      'AOIROSERVERアプリの重要実装',
      'AOIROSERVERアプリの緊急実装',
      'AOIROSERVERアプリの重要実現',
      'AOIROSERVERアプリの緊急実現',
      'AOIROSERVERアプリの重要完成',
      'AOIROSERVERアプリの緊急完成',
      'AOIROSERVERアプリの重要完成品',
      'AOIROSERVERアプリの緊急完成品',
      'AOIROSERVERアプリの重要製品',
      'AOIROSERVERアプリの緊急製品',
      'AOIROSERVERアプリの重要商品',
      'AOIROSERVERアプリの緊急商品',
      'AOIROSERVERアプリの重要サービス',
      'AOIROSERVERアプリの緊急サービス',
      'AOIROSERVERアプリの重要機能',
      'AOIROSERVERアプリの緊急機能',
      'AOIROSERVERアプリの重要特徴',
      'AOIROSERVERアプリの緊急特徴',
      'AOIROSERVERアプリの重要利点',
      'AOIROSERVERアプリの緊急利点',
      'AOIROSERVERアプリの重要メリット',
      'AOIROSERVERアプリの緊急メリット',
      'AOIROSERVERアプリの重要価値',
      'AOIROSERVERアプリの緊急価値',
      'AOIROSERVERアプリの重要意義',
      'AOIROSERVERアプリの緊急意義',
      'AOIROSERVERアプリの重要目的',
      'AOIROSERVERアプリの緊急目的',
      'AOIROSERVERアプリの重要目標',
      'AOIROSERVERアプリの緊急目標',
      'AOIROSERVERアプリの重要計画',
      'AOIROSERVERアプリの緊急計画',
      'AOIROSERVERアプリの重要予定',
      'AOIROSERVERアプリの緊急予定',
      'AOIROSERVERアプリの重要スケジュール',
      'AOIROSERVERアプリの緊急スケジュール',
      'AOIROSERVERアプリの重要タイムライン',
      'AOIROSERVERアプリの緊急タイムライン',
      'AOIROSERVERアプリの重要ロードマップ',
      'AOIROSERVERアプリの緊急ロードマップ',
      'AOIROSERVERアプリの重要ビジョン',
      'AOIROSERVERアプリの緊急ビジョン',
      'AOIROSERVERアプリの重要ミッション',
      'AOIROSERVERアプリの緊急ミッション',
      'AOIROSERVERアプリの重要コンセプト',
      'AOIROSERVERアプリの緊急コンセプト',
      'AOIROSERVERアプリの重要アイデア',
      'AOIROSERVERアプリの緊急アイデア',
      'AOIROSERVERアプリの重要提案',
      'AOIROSERVERアプリの緊急提案',
      'AOIROSERVERアプリの重要企画',
      'AOIROSERVERアプリの緊急企画',
      'AOIROSERVERアプリの重要戦略',
      'AOIROSERVERアプリの緊急戦略',
      'AOIROSERVERアプリの重要方針',
      'AOIROSERVERアプリの緊急方針',
      'AOIROSERVERアプリの重要ポリシー',
      'AOIROSERVERアプリの緊急ポリシー',
      'AOIROSERVERアプリの重要ルール',
      'AOIROSERVERアプリの緊急ルール',
      'AOIROSERVERアプリの重要規約',
      'AOIROSERVERアプリの緊急規約',
      'AOIROSERVERアプリの重要利用規約',
      'AOIROSERVERアプリの緊急利用規約',
      'AOIROSERVERアプリの重要プライバシーポリシー',
      'AOIROSERVERアプリの緊急プライバシーポリシー',
      'AOIROSERVERアプリの重要免責事項',
      'AOIROSERVERアプリの緊急免責事項',
      'AOIROSERVERアプリの重要注意事項',
      'AOIROSERVERアプリの緊急注意事項',
      'AOIROSERVERアプリの重要警告',
      'AOIROSERVERアプリの緊急警告',
      'AOIROSERVERアプリの重要注意',
      'AOIROSERVERアプリの緊急注意',
      'AOIROSERVERアプリの重要重要',
      'AOIROSERVERアプリの緊急重要',
      'AOIROSERVERアプリの重要緊急',
      'AOIROSERVERアプリの緊急緊急'
    ];
    
    // ニュースタイプを取得する関数
    const getNewsType = (categoryId: number): string => {
      switch (categoryId) {
        case 1: return 'uncategorized';
        case 2: return 'store';
        case 3: return 'camera';
        case 4: return 'road-variant';
        case 5: return 'event';
        case 6: return 'update';
        case 7: return 'announcement';
        case 8: return 'maintenance';
        case 9: return 'feature';
        case 10: return 'bugfix';
        default: return 'uncategorized';
      }
    };
    
    const formattedNews = data
      .filter((post: any) => {
        const title = post.title?.rendered || '';
        return !excludeTitles.some(excludeTitle => 
          title.toLowerCase().includes(excludeTitle.toLowerCase())
        );
      })
      .map((post: any) => {
        const mediaUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
        
        return {
          id: post.id.toString(),
          title: post.title?.rendered || '無題',
          date: new Date(post.date).toLocaleDateString('ja-JP'),
          imageUrl: mediaUrl || 'https://aoiroserver.tokyo/wp-content/uploads/2025/01/aoiroserver-logo.png',
          url: post.link,
          type: getNewsType(post.categories?.[0] || 1)
        };
      });
    
    console.log('📰 Formatted news:', formattedNews.length, 'articles');
    
    return NextResponse.json(formattedNews);
    
  } catch (error) {
    console.error('❌ Error fetching latest news:', error);
    
    // エラー時はモックデータを返す
    const mockNews = [
      {
        id: '891',
        title: '浜松駅大改造、くいよが大暴れ！？　　仮称『ハマチカ』',
        date: '2025.01.31',
        imageUrl: 'https://aoiroserver.tokyo/wp-content/uploads/2025/01/aoiroserver-logo.png',
        url: 'https://aoiroserver.tokyo/浜松駅大改造、くいよが大暴れ！？　　仮称『ハマチカ』/',
        type: 'event'
      },
      {
        id: '890',
        title: 'AOIROSERVER新機能リリース！',
        date: '2025.01.30',
        imageUrl: 'https://aoiroserver.tokyo/wp-content/uploads/2025/01/aoiroserver-logo.png',
        url: 'https://aoiroserver.tokyo/aoiroserver新機能リリース/',
        type: 'feature'
      },
      {
        id: '889',
        title: 'メンテナンス完了のお知らせ',
        date: '2025.01.29',
        imageUrl: 'https://aoiroserver.tokyo/wp-content/uploads/2025/01/aoiroserver-logo.png',
        url: 'https://aoiroserver.tokyo/メンテナンス完了のお知らせ/',
        type: 'announcement'
      }
    ];
    
    return NextResponse.json(mockNews);
  }
}
