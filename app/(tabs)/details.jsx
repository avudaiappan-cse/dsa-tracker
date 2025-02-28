import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { data } from '../../data/data';
import { PieChart, ProgressChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';

// Get screen dimensions for responsive layout
const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isVerySmallScreen = width < 340;

export default function DetailScreen() {
  const [completedProblems, setCompletedProblems] = useState({});
  const [activeChart, setActiveChart] = useState('pie'); // 'pie', 'topic', or 'difficulty'
  const [appState, setAppState] = useState(AppState.currentState);
  
  // Function to load completed problems
  const loadCompletedProblems = async () => {
    try {
      const storedData = await AsyncStorage.getItem('completedProblems');
      if (storedData !== null) {
        setCompletedProblems(JSON.parse(storedData));
      }
    } catch (error) {
      console.error("Failed to load completed problems:", error);
    }
  };
  
  // Load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadCompletedProblems();
      return () => {};
    }, [])
  );
  
  // Also monitor app state changes to refresh data
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        loadCompletedProblems();
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [appState]);
  
  // Initial load of data
  useEffect(() => {
    loadCompletedProblems();
  }, []);

  // Process data for analytics
  const dsaData = data.sheetData;
  const topicStats = {};
  const difficultyStats = { 'Easy': [0, 0], 'Medium': [0, 0], 'Hard': [0, 0] }; // [completed, total]
  
  // Calculate stats by topic
  Object.values(dsaData).forEach(section => {
    const topicName = section.head_step_no;
    topicStats[topicName] = topicStats[topicName] || { completed: 0, total: 0 };
    
    section.topics.forEach(problem => {
      // Increment topic totals
      topicStats[topicName].total += 1;
      if (completedProblems[problem.id]) {
        topicStats[topicName].completed += 1;
      }
      
      // Increment difficulty totals
      const difficultyName = problem.difficulty === 0 ? 'Easy' : problem.difficulty === 1 ? 'Medium' : 'Hard';
      difficultyStats[difficultyName][1] += 1;
      if (completedProblems[problem.id]) {
        difficultyStats[difficultyName][0] += 1;
      }
    });
  });
  
  // Calculate overall completion stats
  const totalProblems = Object.values(dsaData).reduce(
    (total, section) => total + section.topics.length, 0
  );
  const completedCount = Object.keys(completedProblems).length;
  const progressPercentage = totalProblems > 0 ? (completedCount / totalProblems) * 100 : 0;

  // Prepare data for pie chart
  const pieChartData = [
    {
      name: 'Completed',
      count: completedCount,
      color: '#4CAF50',
      legendFontColor: '#7F7F7F',
      legendFontSize: isSmallScreen ? 12 : 15,
    },
    {
      name: 'Remaining',
      count: totalProblems - completedCount,
      color: '#F44336',
      legendFontColor: '#7F7F7F',
      legendFontSize: isSmallScreen ? 12 : 15,
    },
  ];

  // Make chart height responsive
  const chartHeight = Math.min(height * 0.25, 220);
  const chartWidth = width - (isSmallScreen ? 30 : 40);

  // Chart config with responsive parameters
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: isSmallScreen ? 1 : 2,
    barPercentage: isSmallScreen ? 0.6 : 0.7,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: isSmallScreen ? 8 : 12,
    },
  };
  
  // Get abbreviated topic names for small screens
  const getTopicName = (topic) => {
    if (!isSmallScreen) return topic;
    if (isVerySmallScreen && topic.length > 10) {
      return topic.substring(0, 8) + '...';
    }
    if (topic.length > 15) {
      return topic.substring(0, 13) + '...';
    }
    return topic.replace('Arrays', 'Arr').replace('Part-', 'P');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header with progress information */}
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Your DSA Journey</Text>
        
        <View style={styles.overviewRow}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>{completedCount}</Text>
            <Text style={styles.overviewLabel}>Completed</Text>
          </View>
          
          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>{totalProblems}</Text>
            <Text style={styles.overviewLabel}>Total</Text>
          </View>
          
          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>{Math.round(progressPercentage)}%</Text>
            <Text style={styles.overviewLabel}>Progress</Text>
          </View>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarOuter}>
            <View 
              style={[
                styles.progressBarInner, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* Chart selector tabs */}
      <View style={styles.chartSwitchContainer}>
        <TouchableOpacity 
          style={[styles.chartSwitch, activeChart === 'pie' && styles.activeChartSwitch]} 
          onPress={() => setActiveChart('pie')}
        >
          <Text style={[styles.chartSwitchText, activeChart === 'pie' && styles.activeChartSwitchText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.chartSwitch, activeChart === 'topic' && styles.activeChartSwitch]} 
          onPress={() => setActiveChart('topic')}
        >
          <Text style={[styles.chartSwitchText, activeChart === 'topic' && styles.activeChartSwitchText]}>
            By Topic
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.chartSwitch, activeChart === 'difficulty' && styles.activeChartSwitch]} 
          onPress={() => setActiveChart('difficulty')}
        >
          <Text style={[styles.chartSwitchText, activeChart === 'difficulty' && styles.activeChartSwitchText]}>
            By Difficulty
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chart Card */}
      <View style={styles.chartCard}>
        {activeChart === 'pie' && (
          <>
            <PieChart
              data={pieChartData}
              width={chartWidth}
              height={chartHeight}
              chartConfig={chartConfig}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft={isSmallScreen ? "5" : "15"}
              absolute
              hasLegend={true}
            />
          </>
        )}
        
        {activeChart === 'topic' && (
          <ScrollView 
            style={[styles.customChartContainer, { maxHeight: height * 0.35 }]} 
            showsVerticalScrollIndicator={true}
          >
            {Object.entries(topicStats).map(([topic, stats]) => {
              const percentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
              return (
                <View key={topic} style={styles.topicBarContainer}>
                  <View style={styles.topicBarHeader}>
                    <Text style={styles.topicBarLabel} numberOfLines={1} ellipsizeMode="tail">
                      {getTopicName(topic)}
                    </Text>
                    <Text style={styles.topicBarCompact}>
                      {stats.completed}/{stats.total}
                    </Text>
                  </View>
                  <View style={styles.topicBarWrapperCompact}>
                    <View style={styles.topicBarBackground}>
                      <View 
                        style={[
                          styles.topicBarFill, 
                          { width: `${percentage}%` }
                        ]} 
                      />
                      {percentage > 15 && (
                        <Text style={styles.topicBarInnerText}>
                          {Math.round(percentage)}%
                        </Text>
                      )}
                    </View>
                    {percentage <= 15 && (
                      <Text style={styles.topicBarOuterText}>
                        {Math.round(percentage)}%
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
        
        {activeChart === 'difficulty' && (
          <>
            <Text style={styles.chartTitle}>Difficulty Breakdown</Text>
            
            <ProgressChart
              data={{
                labels: ["Easy", "Medium", "Hard"],
                data: [
                  difficultyStats['Easy'][1] > 0 ? difficultyStats['Easy'][0] / difficultyStats['Easy'][1] : 0,
                  difficultyStats['Medium'][1] > 0 ? difficultyStats['Medium'][0] / difficultyStats['Medium'][1] : 0,
                  difficultyStats['Hard'][1] > 0 ? difficultyStats['Hard'][0] / difficultyStats['Hard'][1] : 0
                ],
              }}
              width={chartWidth}
              height={chartHeight}
              strokeWidth={isSmallScreen ? 12 : 16}
              radius={isSmallScreen ? 24 : 32}
              chartConfig={{
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1, index) => {
                  const colors = ['rgba(76, 175, 80, 1)', 'rgba(255, 152, 0, 1)', 'rgba(244, 67, 54, 1)'];
                  return colors[index % colors.length];
                },
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                propsForLabels: { fontSize: isSmallScreen ? 10 : 12 },
              }}
              hideLegend={false}
            />
            
            <View style={styles.difficultyLegend}>
              {Object.entries(difficultyStats).map(([difficulty, [completed, total]], index) => {
                const colors = ['#4CAF50', '#FF9800', '#F44336'];
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <View key={difficulty} style={styles.difficultyLegendItem}>
                    <View style={[styles.difficultyColorDot, { backgroundColor: colors[index] }]} />
                    <Text style={styles.difficultyLegendText}>
                      {difficulty}: {completed}/{total} ({percentage}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>
      
      {/* Motivational message based on progress */}
      <View style={styles.motivationCard}>
        <Text style={styles.motivationTitle}>
          {progressPercentage < 25 ? "You're just getting started!" : 
           progressPercentage < 50 ? "Keep up the good work!" : 
           progressPercentage < 75 ? "You're making great progress!" : 
           progressPercentage < 100 ? "Almost there!" : 
           "Congratulations! You've completed everything!"}
        </Text>
        <Text style={styles.motivationText}>
          {progressPercentage < 25 ? "Every problem you solve builds your foundation. Keep going!" : 
           progressPercentage < 50 ? "You're developing good momentum. Stay consistent!" : 
           progressPercentage < 75 ? "You've mastered a significant portion. The hard work is paying off!" : 
           progressPercentage < 100 ? "You're in the final stretch. Just a few more to conquer!" : 
           "You've completed all the problems! Time to celebrate your achievement!"}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: isSmallScreen ? 10 : 15,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: isSmallScreen ? 12 : 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: isSmallScreen ? 18 : 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  overviewItem: {
    alignItems: 'center',
  },
  overviewNumber: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  overviewLabel: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#666',
    marginTop: 4,
  },
  progressBarContainer: {
    marginTop: 5,
  },
  progressBarOuter: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  chartSwitchContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartSwitch: {
    flex: 1,
    paddingVertical: isSmallScreen ? 6 : 8,
    paddingHorizontal: 5,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeChartSwitch: {
    backgroundColor: '#2196F3',
  },
  chartSwitchText: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#666',
  },
  activeChartSwitchText: {
    color: '#fff',
    fontWeight: '500',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: isSmallScreen ? 10 : 15,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  chartTitle: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  customChartContainer: {
    width: '100%',
    paddingHorizontal: 5,
  },
  topicBarContainer: {
    marginBottom: isSmallScreen ? 8 : 10, // More compact spacing
    width: '100%',
  },
  topicBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  topicBarLabel: {
    fontSize: isSmallScreen ? 11 : 13, // Slightly smaller text
    color: '#444',
    fontWeight: '500',
    flex: 1,
  },
  topicBarCompact: {
    fontSize: isSmallScreen ? 10 : 11,
    color: '#666',
    marginLeft: 4,
  },
  topicBarWrapperCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    height: isSmallScreen ? 18 : 22, // Taller bar to fit text inside
  },
  topicBarBackground: {
    height: '100%',
    borderRadius: 10, // More rounded corners
    backgroundColor: '#e0e0e0',
    flex: 1,
    overflow: 'hidden',
    flexDirection: 'row', // To position text inside bar
    alignItems: 'center',
    position: 'relative', // For positioning text
  },
  topicBarFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    position: 'absolute', // Absolute positioning to allow text overlay
    top: 0,
    left: 0,
    borderRadius: 10, // Match parent radius
  },
  topicBarInnerText: { // Text inside the bar for higher percentages
    fontSize: isSmallScreen ? 10 : 11,
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    zIndex: 1, // Make sure text is above the fill
  },
  topicBarOuterText: { // Text outside the bar for small percentages
    fontSize: isSmallScreen ? 10 : 11,
    color: '#555',
    fontWeight: '500',
    marginLeft: 6,
  },
  difficultyLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: isSmallScreen ? 8 : 12,
  },
  difficultyLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyColorDot: {
    width: isSmallScreen ? 8 : 10,
    height: isSmallScreen ? 8 : 10,
    borderRadius: isSmallScreen ? 4 : 5,
    marginRight: 5,
  },
  difficultyLegendText: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#555',
  },
  motivationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: isSmallScreen ? 12 : 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  motivationTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  motivationText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#666',
    lineHeight: isSmallScreen ? 18 : 20,
    textAlign: 'center',
  },
});
