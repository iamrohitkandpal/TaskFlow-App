import React, { useState, useEffect } from 'react';
import { Chip, TextField, Button, Box, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';

const UserSkillsEditor = ({ userId, editable = false }) => {
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchUserSkills = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/users/${userId || 'profile'}`);
        if (response.data.status) {
          setSkills(response.data.user.skills || []);
        }
      } catch (err) {
        console.error('Error fetching user skills:', err);
        setError('Failed to load skills. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserSkills();
  }, [userId]);

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    
    // Don't add duplicate skills
    if (!skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const saveSkills = async () => {
    setLoading(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      const response = await axios.put(
        `${API_BASE_URL}/users/${userId || 'profile'}/skills`,
        { skills }
      );
      
      if (response.data.status) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000); // Clear success message after 3 seconds
      }
    } catch (err) {
      console.error('Error saving user skills:', err);
      setError('Failed to save skills. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Skills
        </Typography>
        
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        {saveSuccess && (
          <Typography color="success.main" variant="body2" sx={{ mb: 2 }}>
            Skills saved successfully!
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {skills.map((skill) => (
            <Chip 
              key={skill} 
              label={skill} 
              onDelete={editable ? () => handleRemoveSkill(skill) : undefined}
              color="primary" 
              variant="outlined"
            />
          ))}
          
          {skills.length === 0 && !loading && (
            <Typography variant="body2" color="text.secondary">
              No skills added yet.
            </Typography>
          )}
          
          {loading && <CircularProgress size={24} />}
        </Box>

        {editable && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Add Skill"
              variant="outlined"
              size="small"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={handleKeyDown}
              fullWidth
            />
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddSkill}
              disabled={!newSkill.trim()}
            >
              Add
            </Button>
          </Box>
        )}
        
        {editable && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={saveSkills}
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              Save Skills
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default UserSkillsEditor;