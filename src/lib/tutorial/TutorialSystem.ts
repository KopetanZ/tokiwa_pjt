export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  category: 'basic' | 'pokemon' | 'training' | 'expedition' | 'economy' | 'advanced';
  prerequisites: string[]; // 前提となるステップID
  objectives: string[]; // 完了条件
  rewards?: {
    money?: number;
    experience?: number;
    items?: Array<{ itemId: string; quantity: number }>;
  };
  isCompleted: boolean;
  isActive: boolean;
}

export interface TutorialGuide {
  id: string;
  title: string;
  description: string;
  steps: string[]; // ステップIDの配列
  category: string;
  estimatedTime: number; // 分単位
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export class TutorialSystem {
  private tutorialSteps: Map<string, TutorialStep>;
  private tutorialGuides: Map<string, TutorialGuide>;
  private userProgress: Map<string, boolean>; // ステップID -> 完了状態

  constructor() {
    this.tutorialSteps = this.initializeTutorialSteps();
    this.tutorialGuides = this.initializeTutorialGuides();
    this.userProgress = new Map();
  }

  private initializeTutorialSteps(): Map<string, TutorialStep> {
    const steps = new Map<string, TutorialStep>();

    // === 基本操作チュートリアル ===
    steps.set('welcome', {
      id: 'welcome',
      title: 'ポケモン学校へようこそ！',
      content: `🎉 **ポケモン学校の校長になりましたね！**

あなたはこれから、ポケモンと共に学び成長する特別な学校を運営していきます。

**ゲームの目的：**
- ポケモンたちを育成して強くする
- トレーナーを雇用してチームを拡大する
- 各地への派遣でお金と経験を稼ぐ
- 学校を発展させて最高のポケモン学校を作る

まずは基本的な操作から覚えていきましょう。
スターターポケモンを受け取って、あなたの冒険を始めてください！

💡 **ヒント：** 画面上部には現在の所持金とレベルが表示されています。`,
      category: 'basic',
      prerequisites: [],
      objectives: ['ゲーム画面を確認する'],
      rewards: { money: 500, experience: 50 },
      isCompleted: false,
      isActive: true
    });

    steps.set('get_starter_pokemon', {
      id: 'get_starter_pokemon',
      title: 'スターターポケモンを受け取ろう',
      content: `⚡ **最初のパートナーです！**

おめでとうございます！あなたの最初のポケモンを受け取りました。
これから一緒に成長していくパートナーです。

**ポケモンの基本情報：**
- **レベル**: ポケモンの強さを表します
- **タイプ**: でんきタイプは特別な特徴があります
- **ステータス**: HP、攻撃力、防御力など6つの能力値
- **なつき度**: あなたとの信頼関係を表します
- **技**: バトルで使用できる技を覚えています

**次にやること：**
1. ポケモンの詳細ステータスを確認してみましょう
2. ポケモンと仲良くなるために訓練を始めましょう

💡 **ヒント：** なつき度が高いほど、ポケモンは能力を発揮しやすくなります！`,
      category: 'pokemon',
      prerequisites: ['welcome'],
      objectives: ['スターターポケモンを受け取る', 'ポケモンの詳細を確認する'],
      rewards: { money: 1000, experience: 100 },
      isCompleted: false,
      isActive: false
    });

    steps.set('first_training', {
      id: 'first_training',
      title: '初めての訓練をしよう',
      content: `🏋️ **ポケモンを鍛えよう！**

ポケモンは訓練によって強くなります。
基本トレーニング場で初めての訓練を体験してみましょう。

**訓練の効果：**
- **経験値獲得**: レベルアップに必要な経験値が増えます
- **ステータス向上**: 攻撃力、防御力などが成長します
- **なつき度アップ**: あなたとの絆が深まります
- **新しい技**: レベルアップで新しい技を覚えることがあります

**訓練の手順：**
1. 左メニューから「訓練」を選択
2. 訓練したいポケモンを選ぶ
3. 基本訓練プログラムを選択
4. 訓練開始！

**費用について：**
訓練には費用がかかりますが、強くなったポケモンは後でより多くの収入をもたらしてくれます。

💡 **ヒント：** 訓練は時間がかかります。進行中は他の作業をして待ちましょう。`,
      category: 'training',
      prerequisites: ['get_starter_pokemon'],
      objectives: ['基本訓練を1回完了する'],
      rewards: { money: 800, experience: 150 },
      isCompleted: false,
      isActive: false
    });

    steps.set('understand_economy', {
      id: 'understand_economy',
      title: 'お金の仕組みを理解しよう',
      content: `💰 **学校経営の基本は資金管理！**

ポケモン学校を運営するにはお金が必要です。
収入と支出のバランスを理解して、健全な経営を心がけましょう。

**主な収入源：**
- **訓練指導料**: ポケモンの訓練で収入を得る
- **派遣報酬**: トレーナーを派遣して報酬を得る
- **ポケモン販売**: 育てたポケモンを販売する（後期）
- **研究協力費**: 特別な研究に協力して報酬を得る（後期）

**主な支出：**
- **施設維持費**: トレーニング場などの維持費
- **ポケモンの餌代**: ポケモンたちの食事代
- **トレーナー給与**: 雇用したトレーナーの給料
- **設備投資**: 施設のアップグレード費用

**資金管理のコツ：**
1. 常に2週間分の運営費は残しておく
2. 収入源を多様化する
3. 無駄な支出は控える
4. 投資は計画的に

現在の所持金: **5,000円**
推奨貯蓄額: **3,000円以上**

💡 **ヒント：** 画面右上の家計簿で収支を確認できます。`,
      category: 'economy',
      prerequisites: ['first_training'],
      objectives: ['家計簿を確認する', 'お金を1,000円以上稼ぐ'],
      rewards: { money: 1500, experience: 200 },
      isCompleted: false,
      isActive: false
    });

    steps.set('hire_first_trainer', {
      id: 'hire_first_trainer',
      title: 'トレーナーを雇用しよう',
      content: `👥 **チームを拡大する時です！**

ポケモン学校が成長してきました。そろそろトレーナーを雇用して、
より大きな派遣や複数の訓練を同時に行えるようにしましょう。

**トレーナーの役割：**
- **派遣リーダー**: 各地への調査・探索派遣を指揮
- **訓練補助**: より高度な訓練プログラムの実施
- **ポケモンケア**: ポケモンたちの健康管理
- **収入拡大**: 新しい収入源の開拓

**トレーナーの種類：**
- **新人トレーナー**: 費用3,000円、基本的な能力
- **経験者トレーナー**: 費用8,000円、高い専門性
- **エキスパート**: 費用20,000円、特別な能力（後期）

**雇用時の注意：**
- トレーナーには週給1,000円程度の給料が必要
- 専門性の高いトレーナーは給料も高い
- でも長期的には大きな利益をもたらしてくれます

**雇用の手順：**
1. 「トレーナー管理」メニューを選択
2. 「新しいトレーナーを雇用」をクリック
3. 候補者から1人を選んで雇用

💡 **ヒント：** 最初は新人トレーナーで十分です。慣れてから専門家を雇いましょう。`,
      category: 'expedition',
      prerequisites: ['understand_economy'],
      objectives: ['トレーナーを1人雇用する'],
      rewards: { money: 2000, experience: 300 },
      isCompleted: false,
      isActive: false
    });

    steps.set('first_expedition', {
      id: 'first_expedition',
      title: '初めての派遣に挑戦',
      content: `🗺️ **外の世界へ冒険に出よう！**

トレーナーを雇用したので、いよいよ派遣に挑戦できます。
派遣は安定した収入源となる重要な活動です。

**派遣の仕組み：**
- トレーナーが指定された場所に一定時間派遣される
- 時間経過で自動的に進行し、報酬を獲得
- 派遣の難易度が高いほど報酬も大きい
- 失敗のリスクもあるが、成功すればポケモンとの出会いも

**派遣の種類：**
- **簡単**: 近場の調査、報酬300-800円、2時間
- **普通**: 森の奥の探索、報酬800-1,500円、4時間  
- **困難**: 危険地帯の調査、報酬1,500-3,000円、8時間

**最初の派遣のコツ：**
1. 「簡単」レベルから始める
2. 信頼できるトレーナーを選ぶ
3. 派遣前にトレーナーの体力を確認
4. 複数の派遣は同時実行可能

**派遣の手順：**
1. 「派遣管理」メニューを選択
2. 利用可能なトレーナーを確認
3. 派遣先と難易度を選択
4. 派遣開始！

💡 **ヒント：** 派遣中はリアルタイムで進行状況が更新されます。`,
      category: 'expedition',
      prerequisites: ['hire_first_trainer'],
      objectives: ['簡単な派遣を1回完了する'],
      rewards: { money: 2500, experience: 400 },
      isCompleted: false,
      isActive: false
    });

    steps.set('catch_pokemon', {
      id: 'catch_pokemon',
      title: '野生のポケモンを捕まえよう',
      content: `🎯 **新しい仲間を見つけよう！**

派遣を通じて野生のポケモンと出会う機会があります。
新しいポケモンを捕まえて、チームを拡大しましょう。

**ポケモン捕獲の基本：**
- 派遣中に野生ポケモンと遭遇することがある
- モンスターボールを使って捕獲を試みる
- ポケモンのレアリティによって捕獲難易度が変わる
- 捕獲に失敗することもある

**レアリティと捕獲率：**
- **普通**: 80%の成功率、どこでも出会える
- **珍しい**: 60%の成功率、特定の場所に出現
- **レア**: 30%の成功率、滅多に出会えない
- **色違い**: 通常と異なる色、非常に珍しい

**捕獲のコツ：**
1. ポケモンのHPを削ってから捕獲する
2. 状態異常にして動きを封じる
3. より良いボールを使用する
4. トレーナーのレベルが高いと成功率アップ

**新しいポケモンの活用法：**
- タイプバランスを考えてチーム編成
- それぞれの特性を活かした訓練
- 強いポケモンは派遣のサポート役に
- 余ったポケモンは販売も可能（後期）

💡 **ヒント：** 最初はどんなポケモンでも大切に育ててみましょう。`,
      category: 'pokemon',
      prerequisites: ['first_expedition'],
      objectives: ['野生のポケモンを1匹捕獲する'],
      rewards: { money: 3000, experience: 500 },
      isCompleted: false,
      isActive: false
    });

    steps.set('facility_upgrade', {
      id: 'facility_upgrade',
      title: '施設をアップグレードしよう',
      content: `🏗️ **学校をもっと良くしよう！**

順調にポケモン学校が成長してきました。
そろそろ施設のアップグレードを検討する時期です。

**施設アップグレードの効果：**
- **容量増加**: より多くのポケモンを同時に訓練
- **効率向上**: 同じ時間でより良い結果
- **新機能解放**: 高レベル限定の訓練プログラム
- **コスト効率**: 長期的な運営コストの削減

**アップグレード可能な施設：**
- **基本トレーニング場**: Lv.2で容量+2、効率+20%
- **ポケモンセンター**: 建設で回復速度向上
- **研究施設**: 建設で新しい収入源の開拓
- **繁殖センター**: 建設でポケモンの卵生産

**アップグレードの判断基準：**
1. 現在の施設の稼働率が80%以上
2. アップグレード費用の回収見込みが1ヶ月以内
3. 安定した収入源が確保されている
4. 緊急時資金を除いても余裕がある

**推奨する順序：**
1. 基本トレーニング場のレベルアップ
2. ポケモンセンターの建設
3. 専門施設の検討

現在の建設可能施設をチェックして、計画的に投資しましょう。

💡 **ヒント：** 建設中は一時的に機能が制限される場合があります。`,
      category: 'advanced',
      prerequisites: ['catch_pokemon'],
      objectives: ['施設を1つアップグレードまたは新設する'],
      rewards: { money: 5000, experience: 600 },
      isCompleted: false,
      isActive: false
    });

    steps.set('sustainable_operation', {
      id: 'sustainable_operation',
      title: '安定経営を目指そう',
      content: `📊 **持続可能な学校運営！**

おめでとうございます！基本的な学校運営の流れを覚えました。
これからは安定した経営を目指していきましょう。

**安定経営の指標：**
- **月間収支**: 黒字を維持する
- **資金余力**: 2週間分の運営費を常に確保
- **成長投資**: 収入の20-30%を新規投資に回す
- **リスク管理**: 収入源を複数確保する

**今後の発展戦略：**
1. **ポケモンチーム拡大**: 8-10匹まで増やす
2. **トレーナー増員**: 専門分野に特化した人材
3. **施設多様化**: 特色ある施設で差別化
4. **地域展開**: より遠くの派遣先の開拓

**上級要素の解放条件：**
- **ポケモン繁殖**: レベル15、繁殖センター建設
- **競技大会**: レベル20、強いポケモンが必要  
- **研究事業**: レベル25、研究施設建設
- **支校開設**: レベル30、大規模な資金が必要

**定期的にチェックすべき項目：**
- [ ] 家計簿で収支バランス確認
- [ ] ポケモンの成長状況確認
- [ ] トレーナーのコンディション確認
- [ ] 施設の稼働状況確認
- [ ] 新しい派遣先の開拓

これで基本チュートリアルは完了です。
あなただけの特別なポケモン学校を作り上げてください！

💡 **ヒント：** 困った時は、ヘルプメニューでいつでも情報を確認できます。`,
      category: 'advanced',
      prerequisites: ['facility_upgrade'],
      objectives: ['月間収支を黒字にする', 'ポケモンを5匹以上にする'],
      rewards: { money: 10000, experience: 1000 },
      isCompleted: false,
      isActive: false
    });

    return steps;
  }

  private initializeTutorialGuides(): Map<string, TutorialGuide> {
    const guides = new Map<string, TutorialGuide>();

    guides.set('complete_beginner', {
      id: 'complete_beginner',
      title: '完全初心者ガイド',
      description: 'ポケモン学校運営が初めての方向けの完全ガイド',
      steps: [
        'welcome',
        'get_starter_pokemon', 
        'first_training',
        'understand_economy',
        'hire_first_trainer',
        'first_expedition',
        'catch_pokemon',
        'facility_upgrade',
        'sustainable_operation'
      ],
      category: 'beginner',
      estimatedTime: 45,
      difficulty: 'beginner'
    });

    guides.set('pokemon_master', {
      id: 'pokemon_master',
      title: 'ポケモン育成マスター',
      description: 'ポケモンの育成と進化に特化したガイド',
      steps: [
        'get_starter_pokemon',
        'first_training',
        'catch_pokemon'
      ],
      category: 'pokemon',
      estimatedTime: 20,
      difficulty: 'intermediate'
    });

    guides.set('business_manager', {
      id: 'business_manager',
      title: '学校経営マスター',
      description: '効率的な学校経営と資金管理のガイド',
      steps: [
        'understand_economy',
        'hire_first_trainer', 
        'first_expedition',
        'facility_upgrade',
        'sustainable_operation'
      ],
      category: 'economy',
      estimatedTime: 30,
      difficulty: 'advanced'
    });

    return guides;
  }

  // ユーザーの進行状況を取得
  getUserProgress(): Map<string, boolean> {
    return new Map(this.userProgress);
  }

  // ステップを完了としてマーク
  completeStep(stepId: string): boolean {
    const step = this.tutorialSteps.get(stepId);
    if (!step) return false;

    step.isCompleted = true;
    step.isActive = false;
    this.userProgress.set(stepId, true);

    // 次のステップをアクティブにする
    this.activateNextSteps(stepId);
    return true;
  }

  // 次のステップをアクティブ化
  private activateNextSteps(completedStepId: string): void {
    Array.from(this.tutorialSteps.entries()).forEach(([stepId, step]) => {
      if (!step.isCompleted && 
          !step.isActive && 
          step.prerequisites.includes(completedStepId) &&
          step.prerequisites.every(prereq => this.userProgress.get(prereq))) {
        step.isActive = true;
      }
    });
  }

  // 現在アクティブなステップを取得
  getActiveSteps(): TutorialStep[] {
    return Array.from(this.tutorialSteps.values())
      .filter(step => step.isActive)
      .sort((a, b) => a.prerequisites.length - b.prerequisites.length);
  }

  // 完了済みのステップを取得
  getCompletedSteps(): TutorialStep[] {
    return Array.from(this.tutorialSteps.values())
      .filter(step => step.isCompleted);
  }

  // 特定のステップを取得
  getStep(stepId: string): TutorialStep | null {
    return this.tutorialSteps.get(stepId) || null;
  }

  // 特定のガイドを取得
  getGuide(guideId: string): TutorialGuide | null {
    return this.tutorialGuides.get(guideId) || null;
  }

  // すべてのガイドを取得
  getAllGuides(): TutorialGuide[] {
    return Array.from(this.tutorialGuides.values());
  }

  // カテゴリ別のステップを取得
  getStepsByCategory(category: string): TutorialStep[] {
    return Array.from(this.tutorialSteps.values())
      .filter(step => step.category === category);
  }

  // 進行状況の統計を取得
  getProgressStats(): {
    totalSteps: number;
    completedSteps: number;
    activeSteps: number;
    completionPercentage: number;
  } {
    const totalSteps = this.tutorialSteps.size;
    const completedSteps = this.getCompletedSteps().length;
    const activeSteps = this.getActiveSteps().length;
    const completionPercentage = Math.floor((completedSteps / totalSteps) * 100);

    return {
      totalSteps,
      completedSteps,
      activeSteps,
      completionPercentage
    };
  }

  // チュートリアルの初期化（新規ユーザー向け）
  initializeForNewUser(): void {
    this.userProgress.clear();
    
    // 全ステップをリセット
    Array.from(this.tutorialSteps.values()).forEach(step => {
      step.isCompleted = false;
      step.isActive = false;
    });

    // 最初のステップ（welcome）をアクティブに
    const welcomeStep = this.tutorialSteps.get('welcome');
    if (welcomeStep) {
      welcomeStep.isActive = true;
    }
  }

  // 推奨される次のアクションを取得
  getRecommendedActions(): string[] {
    const activeSteps = this.getActiveSteps();
    const recommendations: string[] = [];

    for (const step of activeSteps.slice(0, 3)) { // 最大3つまで
      recommendations.push(`📋 ${step.title}: ${step.objectives[0]}`);
    }

    return recommendations;
  }
}

export const tutorialSystem = new TutorialSystem();