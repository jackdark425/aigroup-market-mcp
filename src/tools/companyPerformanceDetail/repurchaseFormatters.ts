// 股票回购数据格式化器

// 格式化股票回购数据
export function formatRepurchase(data: any[]): string {
  if (!data || data.length === 0) {
    return 'ℹ️ 暂无股票回购数据\n\n';
  }

  let output = '';

  // 按进度状态分组
  const groupedByProc = data.reduce((acc, item) => {
    const proc = item.proc || '未知状态';
    if (!acc[proc]) {
      acc[proc] = [];
    }
    acc[proc].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  // 进度排序优先级
  const procPriority: Record<string, number> = {
    '实施': 1,
    '完成': 2,
    '股东大会通过': 3,
    '董事会通过': 4,
    '其他': 5,
    '未知状态': 6
  };

  const sortedProcs = Object.keys(groupedByProc).sort((a, b) => {
    const priorityA = procPriority[a] || 5;
    const priorityB = procPriority[b] || 5;
    return priorityA - priorityB;
  });

  for (const proc of sortedProcs) {
    const items = groupedByProc[proc];
    
    output += `### 📊 回购进度: ${proc}\n\n`;

    // 计算该状态下的汇总信息
    const totalVol = items.reduce((sum: number, item: any) => sum + (parseFloat(item.vol) || 0), 0);
    const totalAmount = items.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);

    output += `**汇总信息:**\n`;
    if (totalVol > 0) {
      output += `- 回购总股数: ${formatNumber(totalVol)} 股\n`;
    }
    if (totalAmount > 0) {
      output += `- 回购总金额: ${formatMoney(totalAmount)} 元\n`;
    }
    output += `- 回购计划数: ${items.length} 个\n\n`;

    // 按公告日期排序（最新在前）
    const sortedItems = items.sort((a: any, b: any) => {
      const dateA = a.ann_date || '00000000';
      const dateB = b.ann_date || '00000000';
      return dateB.localeCompare(dateA);
    });

    output += `| 公告日期 | 截止日期 | 回购数量 | 回购金额 | 价格区间 | 过期日期 |\n`;
    output += `|---------|---------|---------|---------|---------|----------|\n`;

    for (const item of sortedItems) {
      const annDate = formatDate(item.ann_date);
      const endDate = formatDate(item.end_date);
      const expDate = formatDate(item.exp_date);
      
      const vol = item.vol ? formatNumber(parseFloat(item.vol)) + ' 股' : '-';
      const amount = item.amount ? formatMoney(parseFloat(item.amount)) + ' 元' : '-';
      
      let priceRange = '-';
      if (item.high_limit && item.low_limit) {
        priceRange = `${parseFloat(item.low_limit).toFixed(2)}-${parseFloat(item.high_limit).toFixed(2)} 元`;
      } else if (item.high_limit) {
        priceRange = `≤${parseFloat(item.high_limit).toFixed(2)} 元`;
      } else if (item.low_limit) {
        priceRange = `≥${parseFloat(item.low_limit).toFixed(2)} 元`;
      }

      output += `| ${annDate} | ${endDate} | ${vol} | ${amount} | ${priceRange} | ${expDate} |\n`;
    }

    output += '\n';
  }

  // 添加整体统计
  const allTotalVol = data.reduce((sum: number, item: any) => sum + (parseFloat(item.vol) || 0), 0);
  const allTotalAmount = data.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);
  const completedItems = data.filter(item => item.proc === '完成');
  const ongoingItems = data.filter(item => ['实施', '股东大会通过', '董事会通过'].includes(item.proc));

  output += `### 📈 整体统计\n\n`;
  if (allTotalVol > 0) {
    output += `- **累计回购股数**: ${formatNumber(allTotalVol)} 股\n`;
  }
  if (allTotalAmount > 0) {
    output += `- **累计回购金额**: ${formatMoney(allTotalAmount)} 元\n`;
  }
  output += `- **回购计划总数**: ${data.length} 个\n`;
  output += `- **已完成计划**: ${completedItems.length} 个\n`;
  output += `- **进行中计划**: ${ongoingItems.length} 个\n\n`;

  return output;
}

// 格式化日期显示
function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === 'None' || dateStr === 'null') {
    return '-';
  }
  if (dateStr.length === 8) {
    return `${dateStr.substr(0,4)}-${dateStr.substr(4,2)}-${dateStr.substr(6,2)}`;
  }
  return dateStr;
}

// 格式化数字显示
function formatNumber(num: number): string {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿';
  } else if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万';
  } else {
    return num.toLocaleString();
  }
}

// 格式化金额显示
function formatMoney(amount: number): string {
  if (amount >= 100000000) {
    return (amount / 100000000).toFixed(2) + '亿';
  } else if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万';
  } else {
    return amount.toLocaleString();
  }
} 