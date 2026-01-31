import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { Colors, wp, hp } from '../../utils/Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../../common/screenHeader';
import DetailModal from '../../common/detailModal';

const Courses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState(null);

  const filters = [
    { id: 'all', label: 'All Courses' },
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' },
    { id: 'certificate', label: 'Certified' },
  ];

  const courses = [
    {
      id: 1,
      title: 'Introduction to Digital Marketing',
      instructor: 'Sarah Johnson',
      duration: '8 weeks',
      level: 'Beginner',
      category: 'Marketing',
      rating: 4.8,
      students: 1250,
      price: 'Free',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
      description: 'Learn the fundamentals of digital marketing including SEO, social media, and content strategy.',
      status: 'enrolled',
    },
    {
      id: 2,
      title: 'Advanced Web Development',
      instructor: 'Michael Chen',
      duration: '12 weeks',
      level: 'Advanced',
      category: 'Technology',
      rating: 4.9,
      students: 890,
      price: '$299',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop',
      description: 'Master modern web development with React, Node.js, and cloud deployment strategies.',
      status: 'available',
    },
    {
      id: 3,
      title: 'Data Science Fundamentals',
      instructor: 'Dr. Emily Rodriguez',
      duration: '10 weeks',
      level: 'Intermediate',
      category: 'Data Science',
      rating: 4.7,
      students: 2100,
      price: '$199',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
      description: 'Introduction to data analysis, machine learning, and visualization techniques.',
      status: 'available',
    },
    {
      id: 4,
      title: 'Leadership & Management',
      instructor: 'James Wilson',
      duration: '6 weeks',
      level: 'Intermediate',
      category: 'Business',
      rating: 4.6,
      students: 1650,
      price: '$249',
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=400&fit=crop',
      description: 'Develop essential leadership skills and learn effective team management strategies.',
      status: 'completed',
    },
    {
      id: 5,
      title: 'UI/UX Design Masterclass',
      instructor: 'Lisa Anderson',
      duration: '9 weeks',
      level: 'Intermediate',
      category: 'Design',
      rating: 4.8,
      students: 980,
      price: '$179',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=400&fit=crop',
      description: 'Create stunning user interfaces and improve user experience with modern design principles.',
      status: 'available',
    },
    {
      id: 6,
      title: 'Python Programming Basics',
      instructor: 'David Kim',
      duration: '7 weeks',
      level: 'Beginner',
      category: 'Programming',
      rating: 4.9,
      students: 3200,
      price: 'Free',
      image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=400&fit=crop',
      description: 'Start your programming journey with Python. Learn syntax, data structures, and basic algorithms.',
      status: 'enrolled',
    },
    {
      id: 7,
      title: 'Project Management Professional',
      instructor: 'Robert Taylor',
      duration: '14 weeks',
      level: 'Advanced',
      category: 'Business',
      rating: 4.7,
      students: 750,
      price: '$399',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
      description: 'Earn your PMP certification with comprehensive project management training and exam prep.',
      status: 'available',
    },
    {
      id: 8,
      title: 'Cloud Computing Essentials',
      instructor: 'Amanda Lee',
      duration: '8 weeks',
      level: 'Intermediate',
      category: 'Technology',
      rating: 4.8,
      students: 1400,
      price: '$229',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
      description: 'Understand cloud architecture, AWS, Azure, and deployment strategies for modern applications.',
      status: 'available',
    },
  ];

  const filteredCourses = courses.filter(course => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'beginner') return course.level === 'Beginner';
    if (selectedFilter === 'intermediate') return course.level === 'Intermediate';
    if (selectedFilter === 'advanced') return course.level === 'Advanced';
    if (selectedFilter === 'certificate') return course.price !== 'Free';
    return true;
  }).filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'enrolled':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'available':
        return { bg: '#DBEAFE', text: '#2563EB' };
      case 'completed':
        return { bg: '#FEF3C7', text: '#D97706' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'enrolled':
        return 'Enrolled';
      case 'available':
        return 'Enroll Now';
      case 'completed':
        return 'Completed';
      default:
        return 'Available';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'Intermediate':
        return { bg: '#DBEAFE', text: '#2563EB' };
      case 'Advanced':
        return { bg: '#FEE2E2', text: '#DC2626' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader title="Courses" />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              selectedFilter === filter.id && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === filter.id && styles.filterButtonTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Courses List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => {
            const statusColors = getStatusColor(course.status);
            const levelColors = getLevelColor(course.level);
            return (
              <TouchableOpacity
                key={course.id}
                style={styles.courseCard}
                activeOpacity={0.8}
                onPress={() => setSelectedCourse(course)}
              >
                <Image
                  source={{ uri: course.image }}
                  style={styles.courseImage}
                  resizeMode="cover"
                />
                <View style={styles.courseContent}>
                  <View style={styles.courseHeader}>
                    <View style={[styles.levelBadge, { backgroundColor: levelColors.bg }]}>
                      <Text style={[styles.levelBadgeText, { color: levelColors.text }]}>
                        {course.level}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                        {getStatusLabel(course.status)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.courseInstructor}>by {course.instructor}</Text>
                  <Text style={styles.courseDescription} numberOfLines={2}>
                    {course.description}
                  </Text>

                  <View style={styles.courseDetails}>
                    <View style={styles.courseDetailRow}>
                      <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.courseDetailText}>{course.duration}</Text>
                    </View>
                    <View style={styles.courseDetailRow}>
                      <Ionicons name="people-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.courseDetailText}>{course.students.toLocaleString()} students</Text>
                    </View>
                    <View style={styles.courseDetailRow}>
                      <Ionicons name="star" size={16} color="#FFB800" />
                      <Text style={styles.courseDetailText}>{course.rating}</Text>
                    </View>
                  </View>

                  <View style={styles.courseFooter}>
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryText}>{course.category}</Text>
                    </View>
                    <Text style={styles.coursePrice}>{course.price}</Text>
                  </View>

                  {course.status === 'available' && (
                    <TouchableOpacity 
                      style={styles.enrollButton}
                      onPress={() => setSelectedCourse(course)}
                    >
                      <Text style={styles.enrollButtonText}>Enroll Now</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No courses found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search or filter criteria
            </Text>
          </View>
        )}
      </ScrollView>

      <DetailModal
        visible={!!selectedCourse}
        onClose={() => setSelectedCourse(null)}
        item={selectedCourse}
      >
        <View style={styles.modalDetails}>
          <Text style={styles.instructorText}>Instructor: {selectedCourse?.instructor}</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{selectedCourse?.duration}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="school-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Level</Text>
              <Text style={styles.detailValue}>{selectedCourse?.level}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="star-outline" size={20} color="#FFB800" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Rating</Text>
              <Text style={styles.detailValue}>{selectedCourse?.rating} ({selectedCourse?.students.toLocaleString()} students)</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="pricetag-outline" size={20} color={selectedCourse?.price === 'Free' ? Colors.success : Colors.primary} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Price</Text>
              <Text style={[styles.detailValue, { color: selectedCourse?.price === 'Free' ? Colors.success : Colors.primary }]}>
                {selectedCourse?.price}
              </Text>
            </View>
          </View>

           {selectedCourse?.status === 'available' && (
             <TouchableOpacity style={[styles.enrollButton, { marginTop: 24 }]}>
               <Text style={styles.enrollButtonText}>Enroll Now</Text>
             </TouchableOpacity>
          )}
        </View>
      </DetailModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  courseCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  courseImage: {
    width: '100%',
    height: 180,
  },
  courseContent: {
    padding: 16,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  courseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  courseDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  courseDetailText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  categoryTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  coursePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  enrollButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  enrollButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  modalDetails: {
    marginTop: 8,
  },
  instructorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  detailTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
    lineHeight: 22,
  },
});

export default Courses;
