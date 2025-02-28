import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Linking, TextInput, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { data } from '../../data/data';

// Get screen width for responsive design
const { width } = Dimensions.get('window');

// Create a CompletionContext for sharing completion state across components
const CompletionContext = React.createContext({
  completedProblems: {},
  toggleCompletion: () => {}
});

// Problem Item Component (Inner most accordion)
const ProblemItem = ({ problem }) => {
    const [open, setOpen] = useState(false);
    const animatedController = useRef(new Animated.Value(0)).current;
    const { completedProblems, toggleCompletion } = useContext(CompletionContext);
    
    // Check if this problem is completed
    const isCompleted = completedProblems[problem.id] || false;

    const toggleAccordion = () => {
        const config = {
            duration: 300,
            toValue: open ? 0 : 1,
            useNativeDriver: true
        };

        Animated.timing(animatedController, config).start();
        setOpen(!open);
    };

    const arrowTransform = animatedController.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '90deg']
    });

    const openLink = (url) => {
        if (url) {
            Linking.openURL(url);
        }
    };

    return (
        <View style={[
            styles.problemContainer,
            isCompleted && styles.completedProblem
        ]}>
            <TouchableOpacity onPress={toggleAccordion} style={styles.problemTitleContainer}>
                <Text style={[
                    styles.problemTitle,
                    isCompleted && styles.completedText
                ]}>
                    {problem.title}
                </Text>
                <Animated.Text style={[styles.problemArrow, { transform: [{ rotate: arrowTransform }] }]}>
                    ▶
                </Animated.Text>
            </TouchableOpacity>

            {open && (
                <View style={styles.problemContentContainer}>
                    <Text style={styles.difficultyText}>
                        Difficulty: {problem.difficulty === 0 ? "Easy" : problem.difficulty === 1 ? "Medium" : "Hard"}
                    </Text>

                    <View style={styles.linksContainer}>
                        {problem.lc_link && (
                            <TouchableOpacity
                                onPress={() => openLink(problem.lc_link)}
                                style={[styles.linkButton, styles.lcButton]}
                            >
                                <Text style={styles.linkButtonText}>LeetCode</Text>
                            </TouchableOpacity>
                        )}

                        {problem.gfg_link && (
                            <TouchableOpacity
                                onPress={() => openLink(problem.gfg_link)}
                                style={[styles.linkButton, styles.gfgButton]}
                            >
                                <Text style={styles.linkButtonText}>GFG</Text>
                            </TouchableOpacity>
                        )}

                        {problem.cs_link && (
                            <TouchableOpacity
                                onPress={() => openLink(problem.cs_link)}
                                style={[styles.linkButton, styles.csButton]}
                            >
                                <Text style={styles.linkButtonText}>Coding Ninjas</Text>
                            </TouchableOpacity>
                        )}

                        {problem.yt_link && (
                            <TouchableOpacity
                                onPress={() => openLink(problem.yt_link)}
                                style={[styles.linkButton, styles.ytButton]}
                            >
                                <Text style={styles.linkButtonText}>YouTube</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={() => toggleCompletion(problem.id)}
                            style={[
                                styles.linkButton,
                                isCompleted ? styles.completedButton : styles.markCompletedButton
                            ]}
                        >
                            <Text style={styles.linkButtonText}>
                                {isCompleted ? "Completed ✓" : "Mark as Complete"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

// Topics Accordion Item (Parent)
const TopicAccordion = ({ topic, problems }) => {
    const [open, setOpen] = useState(false);
    const animatedController = useRef(new Animated.Value(0)).current;

    const toggleAccordion = () => {
        const config = {
            duration: 300,
            toValue: open ? 0 : 1,
            useNativeDriver: true
        };

        Animated.timing(animatedController, config).start();
        setOpen(!open);
    };

    const arrowTransform = animatedController.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '90deg']
    });

    return (
        <View style={styles.accordionContainer}>
            <TouchableOpacity onPress={toggleAccordion} style={styles.titleContainer}>
                <Text style={styles.title}>{topic}</Text>
                <Animated.Text style={[styles.arrow, { transform: [{ rotate: arrowTransform }] }]}>
                    ▶
                </Animated.Text>
            </TouchableOpacity>

            {open && (
                <View style={styles.contentContainer}>
                    {problems.map((problem, index) => (
                        <ProblemItem
                            key={problem.id}
                            problem={problem}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

export default function HomeScreen() {
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        company: '',
        source: 'all', // 'all', 'leetcode', 'gfg', 'codingninjas'
        difficulty: 'all' // 'all', 'easy', 'medium', 'hard'
    });
    
    const [filteredData, setFilteredData] = useState({});
    const filterAnimation = useRef(new Animated.Value(0)).current;
    
    // State for storing completed problems
    const [completedProblems, setCompletedProblems] = useState({});
    
    // Load completed problems from AsyncStorage on initial load
    useEffect(() => {
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
        
        loadCompletedProblems();
    }, []);
    
    // Function to toggle problem completion status
    const toggleCompletion = async (problemId) => {
        try {
            const updatedCompletions = {
                ...completedProblems,
                [problemId]: !completedProblems[problemId]
            };
            
            // If the status is false (uncompleted), remove it from the object completely
            if (!updatedCompletions[problemId]) {
                delete updatedCompletions[problemId];
            }
            
            // Update state
            setCompletedProblems(updatedCompletions);
            
            // Save to AsyncStorage
            await AsyncStorage.setItem('completedProblems', JSON.stringify(updatedCompletions));
        } catch (error) {
            console.error("Failed to update problem completion:", error);
        }
    };

    // Sample data structure from your JSON
    const dsaData = data.sheetData;

    // Handle toggling the filter visibility with animation
    const toggleFilters = () => {
        setShowFilters(!showFilters);
        Animated.timing(filterAnimation, {
            toValue: showFilters ? 0 : 1,
            duration: 300,
            useNativeDriver: false
        }).start();
    };

    // Apply filters whenever filters change
    useEffect(() => {
        // Group and filter data by head_step_no
        const filtered = {};
        
        Object.values(dsaData).forEach(stepData => {
            const topicName = stepData.head_step_no;
            
            // Filter problems based on current filters
            const filteredProblems = stepData.topics.filter(problem => {
                // Company tag filter
                const companyMatch = !filters.company || 
                    (problem.company_tags && 
                     JSON.parse(problem.company_tags || '[]')
                        .some(tag => tag.toLowerCase().includes(filters.company.toLowerCase())));
                
                // Source filter (LeetCode, GFG)
                const sourceMatch = filters.source === 'all' || 
                    (filters.source === 'leetcode' && problem.lc_link) ||
                    (filters.source === 'gfg' && problem.gfg_link) ||
                    (filters.source === 'codingninjas' && problem.cs_link);
                
                // Difficulty filter
                const difficultyMatch = filters.difficulty === 'all' || 
                    (filters.difficulty === 'easy' && problem.difficulty === 0) ||
                    (filters.difficulty === 'medium' && problem.difficulty === 1) ||
                    (filters.difficulty === 'hard' && problem.difficulty === 2);
                
                return companyMatch && sourceMatch && difficultyMatch;
            });
            
            // Only add to filtered data if there are matching problems
            if (filteredProblems.length > 0) {
                filtered[topicName] = filteredProblems;
            }
        });
        
        setFilteredData(filtered);
    }, [filters]);

    // Calculate if any filters are active for highlighting the filter button
    const areFiltersActive = 
        filters.company !== '' || 
        filters.source !== 'all' || 
        filters.difficulty !== 'all';

    // Calculate total and completed problems count for progress display
    const totalProblems = Object.values(dsaData).reduce(
        (total, section) => total + section.topics.length, 0
    );
    const completedCount = Object.keys(completedProblems).length;
    const progressPercentage = totalProblems > 0 ? (completedCount / totalProblems) * 100 : 0;

    return (
        <CompletionContext.Provider value={{ completedProblems, toggleCompletion }}>
            <ScrollView style={styles.container}>
                <View style={styles.headerContainer}>
                    <View>
                        <Text style={styles.header}>DSA Topics</Text>
                        <Text style={styles.progressText}>
                            Progress: {completedCount}/{totalProblems} ({Math.round(progressPercentage)}%)
                        </Text>
                        <View style={styles.progressBarOuter}>
                            <View style={[styles.progressBarInner, { width: `${progressPercentage}%` }]} />
                        </View>
                    </View>
                    
                    <TouchableOpacity 
                        style={[styles.filterToggleButton, areFiltersActive && styles.activeFilterToggleButton]} 
                        onPress={toggleFilters}
                    >
                        <Text style={[styles.filterToggleText, areFiltersActive && styles.activeFilterToggleText]}>
                            {showFilters ? 'Hide Filters' : 'Filter'} {areFiltersActive && '✓'}
                        </Text>
                    </TouchableOpacity>
                </View>
                
                {/* Collapsible Filter Controls */}
                <Animated.View style={[
                    styles.filterContainer,
                    { 
                        maxHeight: filterAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 500] // Adjust based on your filter height
                        }),
                        opacity: filterAnimation,
                        marginBottom: filterAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 20]
                        })
                    }
                ]}>
                    <Text style={styles.filterTitle}>Filters</Text>
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Company name..."
                        value={filters.company}
                        onChangeText={(text) => setFilters({...filters, company: text})}
                    />
                    
                    {/* Source Filter */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterLabel}>Source:</Text>
                        <View style={styles.filterOptionsContainer}>
                            <TouchableOpacity 
                                style={[styles.filterButton, filters.source === 'all' && styles.activeFilterButton]}
                                onPress={() => setFilters({...filters, source: 'all'})}>
                                <Text style={[styles.filterButtonText, filters.source === 'all' && styles.activeFilterText]}>All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.filterButton, filters.source === 'leetcode' && styles.activeFilterButton]}
                                onPress={() => setFilters({...filters, source: 'leetcode'})}>
                                <Text style={[styles.filterButtonText, filters.source === 'leetcode' && styles.activeFilterText]}>LeetCode</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.filterButton, filters.source === 'gfg' && styles.activeFilterButton]}
                                onPress={() => setFilters({...filters, source: 'gfg'})}>
                                <Text style={[styles.filterButtonText, filters.source === 'gfg' && styles.activeFilterText]}>GFG</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.filterButton, filters.source === 'codingninjas' && styles.activeFilterButton]}
                                onPress={() => setFilters({...filters, source: 'codingninjas'})}>
                                <Text style={[styles.filterButtonText, filters.source === 'codingninjas' && styles.activeFilterText]}>Coding Ninjas</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    {/* Difficulty Filter */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterLabel}>Difficulty:</Text>
                        <View style={styles.filterOptionsContainer}>
                            <TouchableOpacity 
                                style={[styles.filterButton, filters.difficulty === 'all' && styles.activeFilterButton]}
                                onPress={() => setFilters({...filters, difficulty: 'all'})}>
                                <Text style={[styles.filterButtonText, filters.difficulty === 'all' && styles.activeFilterText]}>All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.filterButton, filters.difficulty === 'easy' && styles.activeFilterButton]}
                                onPress={() => setFilters({...filters, difficulty: 'easy'})}>
                                <Text style={[styles.filterButtonText, filters.difficulty === 'easy' && styles.activeFilterText]}>Easy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.filterButton, filters.difficulty === 'medium' && styles.activeFilterButton]}
                                onPress={() => setFilters({...filters, difficulty: 'medium'})}>
                                <Text style={[styles.filterButtonText, filters.difficulty === 'medium' && styles.activeFilterText]}>Medium</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.filterButton, filters.difficulty === 'hard' && styles.activeFilterButton]}
                                onPress={() => setFilters({...filters, difficulty: 'hard'})}>
                                <Text style={[styles.filterButtonText, filters.difficulty === 'hard' && styles.activeFilterText]}>Hard</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    <TouchableOpacity 
                        style={styles.resetButton}
                        onPress={() => setFilters({company: '', source: 'all', difficulty: 'all'})}>
                        <Text style={styles.resetButtonText}>Reset Filters</Text>
                    </TouchableOpacity>
                </Animated.View>
                
                {/* Display filtered data */}
                {Object.keys(filteredData).length === 0 ? (
                    <Text style={styles.noResultsText}>No problems match your filters</Text>
                ) : (
                    Object.entries(filteredData).map(([topic, problems]) => (
                        <TopicAccordion
                            key={topic}
                            topic={topic}
                            problems={problems}
                        />
                    ))
                )}

                <Link href="/(tabs)/details" style={styles.link}>
                    <Text style={styles.linkText}>View All Topics</Text>
                </Link>

                {/* Add a button to clear all completions */}
                {completedCount > 0 && (
                    <TouchableOpacity 
                        style={styles.clearCompletedButton}
                        onPress={async () => {
                            try {
                                await AsyncStorage.removeItem('completedProblems');
                                setCompletedProblems({});
                            } catch (error) {
                                console.error("Failed to clear completed problems:", error);
                            }
                        }}
                    >
                        <Text style={styles.clearCompletedButtonText}>
                            Reset All Progress
                        </Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </CompletionContext.Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    filterToggleButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    activeFilterToggleButton: {
        backgroundColor: '#2196F3',
        borderColor: '#2196F3',
    },
    filterToggleText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    activeFilterToggleText: {
        color: 'white',
    },
    accordionContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        marginBottom: 10,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    arrow: {
        fontSize: 16,
        color: '#666',
    },
    contentContainer: {
        padding: 10,
        backgroundColor: '#f0f0f0',
    },
    // Problem item styles
    problemContainer: {
        backgroundColor: 'white',
        borderRadius: 6,
        marginBottom: 8,
        overflow: 'hidden',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    problemTitleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fafafa',
    },
    problemTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#444',
        flex: 1,
    },
    problemArrow: {
        fontSize: 14,
        color: '#777',
    },
    problemContentContainer: {
        padding: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    difficultyText: {
        fontSize: 13,
        marginBottom: 8,
        color: '#666',
    },
    linksContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    linkButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        marginRight: 8,
        marginBottom: 8,
    },
    lcButton: {
        backgroundColor: '#ffa116',
    },
    gfgButton: {
        backgroundColor: '#2f8d46',
    },
    ytButton: {
        backgroundColor: '#ff0000',
    },
    csButton: {
        backgroundColor: '#f28c06', // Coding Ninjas orange color
    },
    linkButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    link: {
        marginTop: 20,
        marginBottom: 40,
        alignSelf: 'center',
    },
    linkText: {
        color: 'tomato',
        fontSize: 16,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    completedProblem: {
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: '#888',
    },
    markCompletedButton: {
        backgroundColor: '#2196F3',
        marginTop: 8,
    },
    completedButton: {
        backgroundColor: '#4CAF50',
        marginTop: 8,
    },
    filterContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 15,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
    },
    filterTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        backgroundColor: '#f9f9f9',
    },
    filterSection: {
        marginBottom: 15,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#444',
        marginBottom: 8,
    },
    filterOptionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 15,
        marginRight: 8,
        marginBottom: 8,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
        minWidth: width < 350 ? 70 : 80, // Responsive width
    },
    activeFilterButton: {
        backgroundColor: '#2196F3',
        borderColor: '#2196F3',
    },
    filterButtonText: {
        fontSize: width < 350 ? 11 : 13,
        textAlign: 'center',
        color: '#666',
    },
    activeFilterText: {
        color: 'white',
        fontWeight: '500',
    },
    resetButton: {
        backgroundColor: '#ff6b6b',
        paddingVertical: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 5,
    },
    resetButtonText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 14,
    },
    noResultsText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        padding: 20,
    },
    progressText: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
        marginBottom: 4,
    },
    progressBarOuter: {
        height: 4,
        width: '100%',
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
        marginBottom: 10,
    },
    progressBarInner: {
        height: 4,
        backgroundColor: '#4CAF50',
        borderRadius: 2,
    },
    clearCompletedButton: {
        backgroundColor: '#ff5252',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 5,
        alignSelf: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    clearCompletedButtonText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 14,
    },
});