import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Project, ProjectDocument } from 'src/schemas/project.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class ProjectService {
    constructor(
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    ) { }

    // Create a new project for a user
    // param data project info with owner ID
    async create(data: {
        name: string;
        description?: string;
        owner: string;
        tags?: string[];
        status: string;
    }) {
        const project = new this.projectModel({
            ...data,
            owner: new Types.ObjectId(data.owner),
        });
        return project.save();
    }

    // Find all projects owned by a user with optional search, pagination
    async findAll(ownerId: string, page = 1, limit = 10, search = '') {
        const skip = (page - 1) * limit;
        const query = {
            owner: new Types.ObjectId(ownerId),
            ...(search && { name: { $regex: search, $options: 'i' } }),
        };

        const [data, total] = await Promise.all([
            this.projectModel.find(query).skip(skip).limit(limit).exec(),
            this.projectModel.countDocuments(query),
        ]);

        return {
            data,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        };
    }

    // Share a project with another user by ID and assign permissions
    async shareProject(projectId: string, userId: string, permissions: string[]) {
        const project = await this.projectModel.findById(projectId);
        if (!project) throw new NotFoundException('Project not found');

        project.sharedWith.push({ user: new Types.ObjectId(userId), permissions });
        return project.save();
    }
}
